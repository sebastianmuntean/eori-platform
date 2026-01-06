import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { sql } from 'drizzle-orm';
import { z } from 'zod';
import { validateSqlQuery, extractSelectColumns } from '@/lib/online-forms/sql-validator';

const testSqlSchema = z.object({
  sqlQuery: z.string().min(1),
  targetModule: z.enum(['registratura', 'general_register', 'events', 'clients']),
});

// Allowed tables per module
const ALLOWED_TABLES: Record<string, string[]> = {
  registratura: ['document_registry', 'document_attachments', 'document_workflow'],
  general_register: ['general_register', 'general_register_attachments', 'general_register_workflow'],
  events: ['church_events', 'church_event_participants', 'church_event_documents'],
  clients: ['clients'],
};

/**
 * POST /api/online-forms/mapping-datasets/test-sql - Test and validate SQL query
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = testSqlSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: validation.error.errors },
        { status: 400 }
      );
    }

    const { sqlQuery, targetModule } = validation.data;

    // Validate SQL query
    const allowedTables = ALLOWED_TABLES[targetModule] || [];
    const validationResult = validateSqlQuery(sqlQuery, allowedTables);

    if (!validationResult.valid) {
      return NextResponse.json(
        { success: false, error: validationResult.error },
        { status: 400 }
      );
    }

    // Try to execute query with LIMIT 0 to get column structure without data
    // Or use EXPLAIN to validate syntax
    try {
      // Use EXPLAIN to validate query without executing it
      const explainQuery = `EXPLAIN (FORMAT JSON) ${sqlQuery}`;
      
      // For safety, we'll just extract columns from SELECT statement
      const columns = extractSelectColumns(sqlQuery);

      // If query is valid but we can't extract columns, try a test execution with LIMIT 1
      if (columns.length === 0) {
        // Try to modify query to add LIMIT 1 for testing
        const testQuery = sqlQuery.trim().replace(/;?\s*$/, '');
        const limitedQuery = testQuery.includes('LIMIT') 
          ? testQuery 
          : `${testQuery} LIMIT 1`;

        // Execute with very limited scope
        const result = await db.execute(sql.raw(limitedQuery));
        
        // Get column names from result
        if (Array.isArray(result) && result.length > 0) {
          const firstRow = result[0];
          const extractedColumns = Object.keys(firstRow as object);
          return NextResponse.json({
            success: true,
            data: {
              columns: extractedColumns,
              sampleRow: firstRow,
            },
          });
        }
      }

      return NextResponse.json({
        success: true,
        data: {
          columns,
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid SQL query';
      return NextResponse.json(
        { success: false, error: `SQL execution error: ${errorMessage}` },
        { status: 400 }
      );
    }
  } catch (error) {
    logError(error, { endpoint: '/api/online-forms/mapping-datasets/test-sql', method: 'POST' });
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      {
        success: false,
        error: errorResponse.error,
      },
      { status: errorResponse.statusCode }
    );
  }
}




