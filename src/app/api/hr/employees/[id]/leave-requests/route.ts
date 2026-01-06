import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { leaveRequests, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Check if employee exists
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      return NextResponse.json(
        { success: false, error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Get all leave requests for this employee
    const requests = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, id))
      .orderBy(desc(leaveRequests.startDate));

    return NextResponse.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]/leave-requests', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







