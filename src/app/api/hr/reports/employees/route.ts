import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employees, employmentContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql, isNull } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const employmentStatus = searchParams.get('employmentStatus');

    const conditions = [];

    if (parishId) {
      conditions.push(eq(employees.parishId, parishId));
    }

    if (employmentStatus) {
      conditions.push(eq(employees.employmentStatus, employmentStatus as any));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get employee counts by status
    const statusCounts = await db
      .select({
        status: employees.employmentStatus,
        count: sql<number>`count(*)`,
      })
      .from(employees)
      .where(whereClause)
      .groupBy(employees.employmentStatus);

    // Get total employees
    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(employees)
      .where(whereClause);
    const total = Number(totalResult[0]?.count || 0);

    // Get employees with active contracts
    const activeContractsResult = await db
      .select({ count: sql<number>`count(distinct ${employees.id})` })
      .from(employees)
      .innerJoin(employmentContracts, eq(employees.id, employmentContracts.employeeId))
      .where(
        and(
          whereClause || sql`1=1`,
          eq(employmentContracts.status, 'active')
        )
      );
    const activeContracts = Number(activeContractsResult[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: {
        total,
        activeContracts,
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status || 'unknown'] = Number(item.count);
          return acc;
        }, {} as Record<string, number>),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/reports/employees', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







