import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { timeEntries, employees } from '@/database/schema';
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

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get time entries for this employee
    let query = db
      .select()
      .from(timeEntries)
      .where(eq(timeEntries.employeeId, id))
      .orderBy(desc(timeEntries.entryDate))
      .limit(limit);

    const entries = await query;

    return NextResponse.json({
      success: true,
      data: entries,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]/time-entries', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







