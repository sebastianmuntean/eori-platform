#!/usr/bin/env tsx
/**
 * Migration script to migrate data from local database to Vercel Neon
 * 
 * This script:
 * 1. Deletes all data from Neon database (preserving structure)
 * 2. Exports all data from local database
 * 3. Imports data into Neon respecting foreign key dependencies
 * 
 * Usage:
 *   DATABASE_URL="postgresql://..." NEON_DATABASE_URL="postgresql://..." npm run migrate:to-neon
 * 
 * Or create a .env.local file with:
 *   DATABASE_URL=postgresql://...
 *   NEON_DATABASE_URL=postgresql://...
 */

import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env.local if it exists
try {
  const envPath = resolve(process.cwd(), '.env.local');
  config({ path: envPath });
} catch (error) {
  // Ignore if .env.local doesn't exist
}

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step: number, total: number, message: string) {
  log(`[${step}/${total}] ${message}`, 'cyan');
}

function logSuccess(message: string) {
  log(`✓ ${message}`, 'green');
}

function logError(message: string) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message: string) {
  log(`⚠ ${message}`, 'yellow');
}

interface TableInfo {
  tableName: string;
  schema: string;
  dependencies: string[]; // Tables this table depends on
  dependents: string[]; // Tables that depend on this table
}

interface MigrationStats {
  tableName: string;
  exported: number;
  imported: number;
  errors: string[];
}

/**
 * Get all tables from the database
 */
async function getAllTables(sql: postgres.Sql): Promise<string[]> {
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;
  return tables.map((t: any) => t.table_name);
}

/**
 * Get foreign key dependencies for all tables
 */
async function getTableDependencies(sql: postgres.Sql): Promise<Map<string, TableInfo>> {
  const fkQuery = await sql`
    SELECT
      tc.table_name AS dependent_table,
      kcu.column_name AS dependent_column,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND ccu.table_name != tc.table_name;
  `;

  const tableMap = new Map<string, TableInfo>();

  // Initialize all tables
  const allTables = await getAllTables(sql);
  for (const tableName of allTables) {
    tableMap.set(tableName, {
      tableName,
      schema: 'public',
      dependencies: [],
      dependents: [],
    });
  }

  // Build dependency graph
  for (const fk of fkQuery) {
    const dependent = fk.dependent_table as string;
    const referenced = fk.referenced_table as string;

    const dependentInfo = tableMap.get(dependent);
    const referencedInfo = tableMap.get(referenced);

    if (dependentInfo && referencedInfo) {
      if (!dependentInfo.dependencies.includes(referenced)) {
        dependentInfo.dependencies.push(referenced);
      }
      if (!referencedInfo.dependents.includes(dependent)) {
        referencedInfo.dependents.push(dependent);
      }
    }
  }

  return tableMap;
}

/**
 * Topological sort to determine correct migration order
 */
function getMigrationOrder(tableMap: Map<string, TableInfo>): string[] {
  const visited = new Set<string>();
  const visiting = new Set<string>();
  const order: string[] = [];

  function visit(tableName: string) {
    if (visiting.has(tableName)) {
      // Circular dependency detected, but we'll continue
      return;
    }
    if (visited.has(tableName)) {
      return;
    }

    visiting.add(tableName);
    const tableInfo = tableMap.get(tableName);
    if (tableInfo) {
      // Visit dependencies first
      for (const dep of tableInfo.dependencies) {
        if (tableMap.has(dep)) {
          visit(dep);
        }
      }
    }
    visiting.delete(tableName);
    visited.add(tableName);
    order.push(tableName);
  }

  // Visit all tables
  for (const tableName of tableMap.keys()) {
    if (!visited.has(tableName)) {
      visit(tableName);
    }
  }

  return order;
}

/**
 * Get reverse order for deletion (dependents first)
 */
function getDeletionOrder(tableMap: Map<string, TableInfo>): string[] {
  return getMigrationOrder(tableMap).reverse();
}

/**
 * Disable foreign key constraints temporarily
 * Note: Vercel Neon doesn't allow setting session_replication_role,
 * so we'll delete data in the correct order instead
 */
async function disableForeignKeys(sql: postgres.Sql): Promise<boolean> {
  try {
    log('Attempting to disable foreign key constraints...', 'yellow');
    await sql`SET session_replication_role = 'replica';`;
    return true;
  } catch (error: any) {
    // Vercel Neon doesn't allow this, we'll delete in correct order instead
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      log('Cannot disable foreign keys (permission denied). Will delete in correct order instead.', 'yellow');
      return false;
    }
    throw error;
  }
}

/**
 * Enable foreign key constraints
 */
async function enableForeignKeys(sql: postgres.Sql, wasDisabled: boolean): Promise<void> {
  if (!wasDisabled) {
    return; // Nothing to re-enable
  }
  try {
    log('Enabling foreign key constraints...', 'yellow');
    await sql`SET session_replication_role = 'origin';`;
  } catch (error: any) {
    // Ignore if we couldn't disable them in the first place
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      log('Could not re-enable foreign keys (permission denied). This is OK.', 'yellow');
    } else {
      throw error;
    }
  }
}

/**
 * Delete all data from a table
 */
async function deleteTableData(sql: postgres.Sql, tableName: string): Promise<number> {
  const escapedTableName = `"${tableName}"`;
  const result = await sql.unsafe(`DELETE FROM ${escapedTableName}`);
  return result.count || 0;
}

/**
 * Export data from a table
 */
async function exportTableData(
  sql: postgres.Sql,
  tableName: string
): Promise<any[]> {
  const escapedTableName = `"${tableName}"`;
  const data = await sql.unsafe(`SELECT * FROM ${escapedTableName}`);
  return data;
}

/**
 * Import data into a table
 */
async function importTableData(
  sql: postgres.Sql,
  tableName: string,
  data: any[]
): Promise<number> {
  if (data.length === 0) {
    return 0;
  }

  // Get column names from first row
  const columns = Object.keys(data[0]);
  
  // Escape column names
  const escapedColumns = columns.map((col) => `"${col}"`).join(', ');
  const escapedTableName = `"${tableName}"`;

  let inserted = 0;
  const batchSize = 500; // Smaller batches for reliability

  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    if (batch.length === 0) continue;

    try {
      // Build VALUES clause with proper escaping
      const values: any[] = [];
      const placeholders: string[] = [];
      
      for (let rowIdx = 0; rowIdx < batch.length; rowIdx++) {
        const row = batch[rowIdx];
        const rowPlaceholders: string[] = [];
        
        for (let colIdx = 0; colIdx < columns.length; colIdx++) {
          const paramIndex = rowIdx * columns.length + colIdx + 1;
          rowPlaceholders.push(`$${paramIndex}`);
          values.push(row[columns[colIdx]]);
        }
        
        placeholders.push(`(${rowPlaceholders.join(', ')})`);
      }

      const query = `
        INSERT INTO ${escapedTableName} (${escapedColumns})
        VALUES ${placeholders.join(', ')}
        ON CONFLICT DO NOTHING
      `;

      const result = await sql.unsafe(query, values);
      inserted += result.count || 0;
    } catch (error: any) {
      // Fallback to row-by-row insert for better error handling
      for (const row of batch) {
        try {
          const rowValues = columns.map((col) => row[col]);
          const rowPlaceholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          
          const query = `
            INSERT INTO ${escapedTableName} (${escapedColumns})
            VALUES (${rowPlaceholders})
            ON CONFLICT DO NOTHING
          `;
          
          await sql.unsafe(query, rowValues);
          inserted++;
        } catch (err: any) {
          // Skip duplicate key or constraint violations
          const errMsg = err.message?.toLowerCase() || '';
          if (
            errMsg.includes('duplicate') ||
            errMsg.includes('violates') ||
            errMsg.includes('unique') ||
            errMsg.includes('foreign key')
          ) {
            // Skip this row
            continue;
          }
          // Re-throw other errors
          throw err;
        }
      }
    }
  }

  return inserted;
}

/**
 * Reset sequences for tables with serial/identity columns
 */
async function resetSequences(sql: postgres.Sql, tableName: string): Promise<void> {
  try {
    const sequences = await sql`
      SELECT column_name, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ${tableName}
        AND column_default LIKE 'nextval%'
    `;

    const escapedTableName = `"${tableName}"`;

    for (const seq of sequences) {
      const columnName = seq.column_name as string;
      const escapedColumnName = `"${columnName}"`;
      
      const maxQuery = await sql.unsafe(
        `SELECT COALESCE(MAX(${escapedColumnName}), 0) as max_val FROM ${escapedTableName}`
      );
      const maxVal = maxQuery[0]?.max_val || 0;
      
      if (maxVal > 0) {
        const seqName = (seq.column_default as string).match(/nextval\('([^']+)'/)?.[1];
        if (seqName) {
          // Extract schema and sequence name
          const seqParts = seqName.split('.');
          const escapedSeqName = seqParts.length > 1 
            ? `"${seqParts[0]}"."${seqParts[1]}"`
            : `"${seqName}"`;
          
          await sql.unsafe(`SELECT setval(${escapedSeqName}, ${maxVal}, true)`);
        }
      }
    }
  } catch (error) {
    // Ignore sequence errors for UUID tables
  }
}

/**
 * Get row count for a table
 */
async function getRowCount(sql: postgres.Sql, tableName: string): Promise<number> {
  const escapedTableName = `"${tableName}"`;
  const result = await sql.unsafe(`SELECT COUNT(*) as count FROM ${escapedTableName}`);
  return parseInt(result[0]?.count || '0', 10);
}

/**
 * Main migration function
 */
async function migrate() {
  // Local database URL (source)
  const localDbUrl = process.env.DATABASE_URL;
  
  // Neon database URL (destination) - try multiple environment variable names
  // Vercel typically sets this as POSTGRES_URL for Neon databases
  const neonDbUrl = process.env.NEON_DATABASE_URL || 
                    process.env.POSTGRES_URL || 
                    process.env.VERCEL_POSTGRES_URL;

  if (!localDbUrl) {
    logError('DATABASE_URL environment variable is not set');
    logError('This should point to your LOCAL database (source)');
    process.exit(1);
  }

  if (!neonDbUrl) {
    logError('Neon database URL not found!');
    logError('Please set one of the following environment variables:');
    logError('  - NEON_DATABASE_URL (preferred)');
    logError('  - POSTGRES_URL (Vercel standard)');
    logError('  - VERCEL_POSTGRES_URL');
    logError('');
    logError('On Vercel, the Neon connection string is usually available as POSTGRES_URL');
    process.exit(1);
  }
  
  // Log which variable was used
  if (process.env.NEON_DATABASE_URL) {
    log('Using NEON_DATABASE_URL for Neon connection', 'blue');
  } else if (process.env.POSTGRES_URL) {
    log('Using POSTGRES_URL for Neon connection (Vercel standard)', 'blue');
  } else if (process.env.VERCEL_POSTGRES_URL) {
    log('Using VERCEL_POSTGRES_URL for Neon connection', 'blue');
  }

  log('Starting database migration from local to Neon...', 'bright');
  log(`Local DB: ${localDbUrl.replace(/:[^:@]+@/, ':****@')}`, 'blue');
  log(`Neon DB: ${neonDbUrl.replace(/:[^:@]+@/, ':****@')}`, 'blue');
  console.log('');

  const localSql = postgres(localDbUrl);
  const neonSql = postgres(neonDbUrl);

  try {
    // Step 1: Discover tables and dependencies
    logStep(1, 6, 'Discovering tables and dependencies...');
    const localTableMap = await getTableDependencies(localSql);
    const neonTableMap = await getTableDependencies(neonSql);
    
    const localTables = Array.from(localTableMap.keys());
    const neonTables = Array.from(neonTableMap.keys());
    
    logSuccess(`Found ${localTables.length} tables in local database`);
    logSuccess(`Found ${neonTables.length} tables in Neon database`);

    // Verify tables match
    const missingInNeon = localTables.filter((t) => !neonTables.includes(t));
    if (missingInNeon.length > 0) {
      logWarning(`Tables missing in Neon: ${missingInNeon.join(', ')}`);
    }

    // Step 2: Determine migration order
    logStep(2, 6, 'Determining migration order...');
    const migrationOrder = getMigrationOrder(localTableMap);
    const deletionOrder = getDeletionOrder(neonTableMap);
    
    logSuccess(`Migration order determined: ${migrationOrder.length} tables`);
    console.log('');

    // Step 3: Delete all data from Neon
    logStep(3, 6, 'Deleting all data from Neon...');
    const fkDisabled = await disableForeignKeys(neonSql);
    
    let totalDeleted = 0;
    // Delete in reverse dependency order (dependents first, then dependencies)
    // This ensures foreign key constraints are respected
    for (const tableName of deletionOrder) {
      if (neonTables.includes(tableName)) {
        try {
          const count = await deleteTableData(neonSql, tableName);
          totalDeleted += count;
          if (count > 0) {
            log(`  Deleted ${count} rows from ${tableName}`, 'yellow');
          }
        } catch (error: any) {
          // If foreign key constraint error and we couldn't disable FKs,
          // try to delete in smaller batches or skip and continue
          if (!fkDisabled && (error.code === '23503' || error.message?.includes('foreign key'))) {
            logWarning(`  Could not delete ${tableName} due to foreign key constraints. Will retry after other deletions.`);
            // Continue with other tables, we'll retry this one
          } else {
            throw error;
          }
        }
      }
    }
    
    // Retry any tables that failed due to foreign key constraints
    if (!fkDisabled) {
      log('Retrying deletions for tables that had foreign key constraints...', 'yellow');
      for (const tableName of deletionOrder) {
        if (neonTables.includes(tableName)) {
          try {
            const count = await deleteTableData(neonSql, tableName);
            if (count > 0) {
              log(`  Deleted ${count} rows from ${tableName} (retry)`, 'yellow');
              totalDeleted += count;
            }
          } catch (error: any) {
            // Log but don't fail - some tables might have circular dependencies
            if (error.code === '23503' || error.message?.includes('foreign key')) {
              logWarning(`  Skipping ${tableName} - still has foreign key references`);
            } else {
              throw error;
            }
          }
        }
      }
    }
    
    await enableForeignKeys(neonSql, fkDisabled);
    logSuccess(`Deleted ${totalDeleted} total rows from Neon`);
    console.log('');

    // Step 4: Export data from local
    logStep(4, 6, 'Exporting data from local database...');
    const exportedData = new Map<string, any[]>();
    let totalExported = 0;

    for (const tableName of migrationOrder) {
      if (localTables.includes(tableName)) {
        const data = await exportTableData(localSql, tableName);
        exportedData.set(tableName, data);
        totalExported += data.length;
        if (data.length > 0) {
          log(`  Exported ${data.length} rows from ${tableName}`, 'blue');
        }
      }
    }

    logSuccess(`Exported ${totalExported} total rows from local database`);
    console.log('');

    // Step 5: Import data into Neon
    logStep(5, 6, 'Importing data into Neon...');
    const importFkDisabled = await disableForeignKeys(neonSql);
    
    const stats: MigrationStats[] = [];
    let totalImported = 0;

    for (const tableName of migrationOrder) {
      if (neonTables.includes(tableName) && exportedData.has(tableName)) {
        const data = exportedData.get(tableName)!;
        const beforeCount = await getRowCount(neonSql, tableName);
        
        try {
          const imported = await importTableData(neonSql, tableName, data);
          const afterCount = await getRowCount(neonSql, tableName);
          
          totalImported += imported;
          stats.push({
            tableName,
            exported: data.length,
            imported: imported,
            errors: [],
          });
          
          if (data.length > 0) {
            log(`  Imported ${imported}/${data.length} rows into ${tableName}`, 'green');
          }
          
          // Reset sequences if needed
          await resetSequences(neonSql, tableName);
        } catch (error: any) {
          const errorMsg = error.message || String(error);
          stats.push({
            tableName,
            exported: data.length,
            imported: 0,
            errors: [errorMsg],
          });
          logError(`  Failed to import ${tableName}: ${errorMsg}`);
        }
      }
    }

    await enableForeignKeys(neonSql, importFkDisabled);
    logSuccess(`Imported ${totalImported} total rows into Neon`);
    console.log('');

    // Step 6: Validation and summary
    logStep(6, 6, 'Validating migration...');
    console.log('');
    log('Migration Summary:', 'bright');
    console.log('');

    let successCount = 0;
    let errorCount = 0;

    for (const stat of stats) {
      if (stat.errors.length === 0 && stat.exported === stat.imported) {
        logSuccess(`${stat.tableName}: ${stat.imported}/${stat.exported} rows`);
        successCount++;
      } else if (stat.errors.length > 0) {
        logError(`${stat.tableName}: ${stat.errors[0]}`);
        errorCount++;
      } else {
        logWarning(`${stat.tableName}: ${stat.imported}/${stat.exported} rows (mismatch)`);
        errorCount++;
      }
    }

    console.log('');
    log(`Total: ${successCount} successful, ${errorCount} with issues`, 
      errorCount > 0 ? 'yellow' : 'green');
    console.log('');

    if (errorCount === 0) {
      logSuccess('Migration completed successfully!');
    } else {
      logWarning('Migration completed with some issues. Please review the summary above.');
    }

  } catch (error: any) {
    logError(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await localSql.end();
    await neonSql.end();
  }
}

// Run migration
migrate().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});

