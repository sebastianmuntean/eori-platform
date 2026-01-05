import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { timeEntries, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parishId = searchParams.get('parishId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const conditions = [];

    if (dateFrom) {
      conditions.push(gte(timeEntries.entryDate, dateFrom));
    }

    if (dateTo) {
      conditions.push(lte(timeEntries.entryDate, dateTo));
    }

    let query = db
      .select({
        totalWorkedHours: sql<number>`coalesce(sum(${timeEntries.workedHours}), 0)`,
        totalOvertimeHours: sql<number>`coalesce(sum(${timeEntries.overtimeHours}), 0)`,
        presentDays: sql<number>`count(*) filter (where ${timeEntries.status} = 'present')`,
        absentDays: sql<number>`count(*) filter (where ${timeEntries.status} = 'absent')`,
        totalDays: sql<number>`count(*)`,
      })
      .from(timeEntries);

    if (parishId) {
      query = query.innerJoin(employees, eq(timeEntries.employeeId, employees.id));
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
        totalWorkedHours: Number(result[0]?.totalWorkedHours || 0),
        totalOvertimeHours: Number(result[0]?.totalOvertimeHours || 0),
        presentDays: Number(result[0]?.presentDays || 0),
        absentDays: Number(result[0]?.absentDays || 0),
        totalDays: Number(result[0]?.totalDays || 0),
      },
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/reports/attendance', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



