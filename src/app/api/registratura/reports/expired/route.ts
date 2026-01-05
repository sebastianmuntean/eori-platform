import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, isNull, lt, sql, or } from 'drizzle-orm';

/**
 * GET /api/registratura/reports/expired - Get documents with expired due dates
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/registratura/reports/expired - Fetching expired documents');

  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const departmentId = searchParams.get('departmentId');

    // Build conditions
    const conditions = [
      isNull(documentRegistry.deletedAt),
      sql`${documentRegistry.dueDate} IS NOT NULL`,
      sql`${documentRegistry.dueDate} < CURRENT_DATE`,
      sql`${documentRegistry.status} NOT IN ('resolved', 'archived')`,
    ];

    if (parishId) {
      conditions.push(eq(documentRegistry.parishId, parishId));
    }

    if (departmentId) {
      conditions.push(eq(documentRegistry.departmentId, departmentId));
    }

    const whereClause = and(...conditions as any[]);

    // Get expired documents
    const expiredDocuments = await db
      .select()
      .from(documentRegistry)
      .where(whereClause)
      .orderBy(sql`${documentRegistry.dueDate} ASC`);

    return NextResponse.json({
      success: true,
      data: expiredDocuments,
      count: expiredDocuments.length,
    });
  } catch (error) {
    console.error('❌ Error fetching expired documents:', error);
    logError(error, { endpoint: '/api/registratura/reports/expired', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




