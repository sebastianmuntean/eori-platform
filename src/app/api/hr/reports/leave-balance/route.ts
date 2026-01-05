import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveRequests, employees, leaveTypes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, and, sql, gte, lte } from 'drizzle-orm';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get('employeeId');
    const parishId = searchParams.get('parishId');
    const year = searchParams.get('year') || new Date().getFullYear().toString();

    const conditions = [];
    conditions.push(sql`extract(year from ${leaveRequests.startDate}) = ${year}`);

    if (employeeId) {
      conditions.push(eq(leaveRequests.employeeId, employeeId));
    }

    let query = db
      .select({
        leaveTypeId: leaveTypes.id,
        leaveTypeName: leaveTypes.name,
        leaveTypeCode: leaveTypes.code,
        maxDaysPerYear: leaveTypes.maxDaysPerYear,
        totalUsed: sql<number>`coalesce(sum(${leaveRequests.totalDays}) filter (where ${leaveRequests.status} = 'approved'), 0)`,
        totalPending: sql<number>`coalesce(sum(${leaveRequests.totalDays}) filter (where ${leaveRequests.status} = 'pending'), 0)`,
      })
      .from(leaveTypes)
      .leftJoin(leaveRequests, eq(leaveTypes.id, leaveRequests.leaveTypeId));

    if (parishId) {
      query = query.leftJoin(employees, eq(leaveRequests.employeeId, employees.id));
      conditions.push(eq(employees.parishId, parishId));
    }

    if (employeeId) {
      query = query.where(eq(leaveRequests.employeeId, employeeId));
    }

    query = query.groupBy(leaveTypes.id, leaveTypes.name, leaveTypes.code, leaveTypes.maxDaysPerYear);

    const result = await query;

    const balance = result.map((item) => ({
      leaveTypeId: item.leaveTypeId,
      leaveTypeName: item.leaveTypeName,
      leaveTypeCode: item.leaveTypeCode,
      maxDaysPerYear: item.maxDaysPerYear,
      usedDays: Number(item.totalUsed || 0),
      pendingDays: Number(item.totalPending || 0),
      remainingDays: item.maxDaysPerYear ? item.maxDaysPerYear - Number(item.totalUsed || 0) : null,
    }));

    return NextResponse.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/reports/leave-balance', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



