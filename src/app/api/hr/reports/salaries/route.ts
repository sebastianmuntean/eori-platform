import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { salaries, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const periodFrom = searchParams.get('periodFrom');
    const periodTo = searchParams.get('periodTo');
    const status = searchParams.get('status');

    const conditions = [];

    if (periodFrom) {
      conditions.push(gte(salaries.salaryPeriod, periodFrom));
    }

    if (periodTo) {
      conditions.push(lte(salaries.salaryPeriod, periodTo));
    }

    if (status) {
      conditions.push(eq(salaries.status, status as any));
    }

    let query = db
      .select({
        totalGross: sql<number>`coalesce(sum(${salaries.grossSalary}), 0)`,
        totalNet: sql<number>`coalesce(sum(${salaries.netSalary}), 0)`,
        totalBenefits: sql<number>`coalesce(sum(${salaries.totalBenefits}), 0)`,
        totalDeductions: sql<number>`coalesce(sum(${salaries.totalDeductions}), 0)`,
        count: sql<number>`count(*)`,
      })
      .from(salaries);

    if (parishId) {
      query = query.innerJoin(employees, eq(salaries.employeeId, employees.id));
      conditions.push(eq(employees.parishId, parishId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    if (whereClause) {
      query = query.where(whereClause);
    }

    const result = await query;

    return NextResponse.json({
      success: true,
      data: {
        totalGross: Number(result[0]?.totalGross || 0),
        totalNet: Number(result[0]?.totalNet || 0),
        totalBenefits: Number(result[0]?.totalBenefits || 0),
        totalDeductions: Number(result[0]?.totalDeductions || 0),
        count: Number(result[0]?.count || 0),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/reports/salaries', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



