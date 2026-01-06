/**
 * SQL Query Validator for Form Mapping Datasets
 * Ensures only safe SELECT queries are allowed
 */

const FORBIDDEN_KEYWORDS = [
  'DROP',
  'DELETE',
  'UPDATE',
  'INSERT',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'EXEC',
  'EXECUTE',
  'CALL',
  'GRANT',
  'REVOKE',
];

/**
 * Validate that a SQL query is safe to execute
 */
export function validateSqlQuery(
  sqlQuery: string,
  allowedTables: string[]
): { valid: boolean; error?: string } {
  const query = sqlQuery.trim().toUpperCase();

  // Check for forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    if (query.includes(keyword)) {
      return {
        valid: false,
        error: `Query contains forbidden keyword: ${keyword}. Only SELECT queries are allowed.`,
      };
    }
  }

  // Must start with SELECT
  if (!query.startsWith('SELECT')) {
    return {
      valid: false,
      error: 'Query must be a SELECT statement',
    };
  }

  // Check that only allowed tables are referenced
  if (allowedTables.length > 0) {
    const queryLower = sqlQuery.toLowerCase();
    for (const table of allowedTables) {
      // Check if table is mentioned in query
      if (queryLower.includes(table.toLowerCase())) {
        // Table is allowed, continue
        continue;
      }
    }

    // Check if any table reference exists (basic check)
    // More sophisticated parsing would be needed for complex queries
    // For now, we'll allow the query if it doesn't contain obvious foreign table references
    const tablePattern = /FROM\s+(\w+)/i;
    const match = queryLower.match(tablePattern);
    if (match) {
      const referencedTable = match[1].toLowerCase();
      const isAllowed = allowedTables.some((t) => t.toLowerCase() === referencedTable);
      if (!isAllowed) {
        return {
          valid: false,
          error: `Table '${referencedTable}' is not allowed for this module`,
        };
      }
    }
  }

  // Basic syntax validation - check for balanced parentheses
  const openParens = (sqlQuery.match(/\(/g) || []).length;
  const closeParens = (sqlQuery.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return {
      valid: false,
      error: 'Query has unbalanced parentheses',
    };
  }

  return { valid: true };
}

/**
 * Extract column names from a SELECT query
 * This is a basic implementation - may need improvement for complex queries
 */
export function extractSelectColumns(sqlQuery: string): string[] {
  const query = sqlQuery.trim();
  
  // Simple extraction - find SELECT ... FROM
  const selectMatch = query.match(/SELECT\s+(.*?)\s+FROM/i);
  if (!selectMatch) {
    return [];
  }

  const selectClause = selectMatch[1];
  
  // Split by comma and extract column names
  const columns: string[] = [];
  const parts = selectClause.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    // Handle AS aliases
    const columnMatch = trimmed.match(/(?:(\w+)\.)?(\w+)(?:\s+AS\s+(\w+))?/i);
    if (columnMatch) {
      // Use alias if present, otherwise use column name
      const columnName = columnMatch[3] || columnMatch[2];
      if (columnName && columnName !== '*') {
        columns.push(columnName);
      }
    }
  }

  return columns;
}

/**
 * Sanitize SQL query for safe execution
 * This adds additional safety checks
 */
export function sanitizeSqlQuery(sqlQuery: string): string {
  let sanitized = sqlQuery.trim();

  // Remove trailing semicolons
  sanitized = sanitized.replace(/;+\s*$/, '');

  // Ensure it's a SELECT
  if (!sanitized.toUpperCase().startsWith('SELECT')) {
    throw new Error('Only SELECT queries are allowed');
  }

  return sanitized;
}








