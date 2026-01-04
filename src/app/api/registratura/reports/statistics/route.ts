import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { documentRegistry } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, isNull, sql } from 'drizzle-orm';

/**
 * GET /api/registratura/reports/statistics - Get document statistics
 */
export async function GET(request: Request) {
  console.log('Step 1: GET /api/registratura/reports/statistics - Fetching statistics');

  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : null;
    const departmentId = searchParams.get('departmentId');

    // Build base conditions
    const conditions = [isNull(documentRegistry.deletedAt)];

    if (parishId) {
      conditions.push(eq(documentRegistry.parishId, parishId));
    }

    if (year) {
      conditions.push(eq(documentRegistry.registrationYear, year));
    }

    if (departmentId) {
      conditions.push(eq(documentRegistry.departmentId, departmentId));
    }

    const whereClause = conditions.length > 1 ? and(...conditions as any[]) : conditions[0];

    // Get statistics by document type
    const byType = await db
      .select({
        documentType: documentRegistry.documentType,
        count: sql<number>`COUNT(*)`,
      })
      .from(documentRegistry)
      .where(whereClause)
      .groupBy(documentRegistry.documentType);

    // Get statistics by status
    const byStatus = await db
      .select({
        status: documentRegistry.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(documentRegistry)
      .where(whereClause)
      .groupBy(documentRegistry.status);

    // Get statistics by priority
    const byPriority = await db
      .select({
        priority: documentRegistry.priority,
        count: sql<number>`COUNT(*)`,
      })
      .from(documentRegistry)
      .where(whereClause)
      .groupBy(documentRegistry.priority);

    // Get total count
    const totalResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(documentRegistry)
      .where(whereClause);
    const total = Number(totalResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: {
        total,
        byType: byType.reduce((acc, item) => {
          acc[item.documentType || 'unknown'] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
        byStatus: byStatus.reduce((acc, item) => {
          acc[item.status || 'unknown'] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
        byPriority: byPriority.reduce((acc, item) => {
          acc[item.priority || 'unknown'] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching statistics:', error);
    logError(error, { endpoint: '/api/registratura/reports/statistics', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


