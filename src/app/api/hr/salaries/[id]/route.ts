import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { salaries } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateSalarySchema = z.object({
  employeeId: z.string().uuid().optional(),
  contractId: z.string().uuid().optional(),
  salaryPeriod: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  baseSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  grossSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  netSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  totalBenefits: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  totalDeductions: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  workingDays: z.number().int().min(0).optional(),
  workedDays: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'calculated', 'approved', 'paid', 'cancelled']).optional(),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  paymentReference: z.string().max(100).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [salary] = await db
      .select()
      .from(salaries)
      .where(eq(salaries.id, id))
      .limit(1);

    if (!salary) {
      return NextResponse.json(
        { success: false, error: 'Salary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: salary,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/salaries/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateSalarySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;
    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (data.employeeId !== undefined) updateData.employeeId = data.employeeId;
    if (data.contractId !== undefined) updateData.contractId = data.contractId;
    if (data.salaryPeriod !== undefined) updateData.salaryPeriod = data.salaryPeriod;
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary;
    if (data.grossSalary !== undefined) updateData.grossSalary = data.grossSalary;
    if (data.netSalary !== undefined) updateData.netSalary = data.netSalary;
    if (data.totalBenefits !== undefined) updateData.totalBenefits = data.totalBenefits;
    if (data.totalDeductions !== undefined) updateData.totalDeductions = data.totalDeductions;
    if (data.workingDays !== undefined) updateData.workingDays = data.workingDays;
    if (data.workedDays !== undefined) updateData.workedDays = data.workedDays;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.paidDate !== undefined) updateData.paidDate = data.paidDate;
    if (data.paymentReference !== undefined) updateData.paymentReference = data.paymentReference;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedSalary] = await db
      .update(salaries)
      .set(updateData)
      .where(eq(salaries.id, id))
      .returning();

    if (!updatedSalary) {
      return NextResponse.json(
        { success: false, error: 'Salary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedSalary,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/salaries/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [deletedSalary] = await db
      .delete(salaries)
      .where(eq(salaries.id, id))
      .returning();

    if (!deletedSalary) {
      return NextResponse.json(
        { success: false, error: 'Salary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedSalary,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/salaries/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

