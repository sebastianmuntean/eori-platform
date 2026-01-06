import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employmentContracts, employees } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

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

    // Get all contracts for this employee
    const contracts = await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.employeeId, id));

    return NextResponse.json({
      success: true,
      data: contracts,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employees/[id]/contracts', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}







