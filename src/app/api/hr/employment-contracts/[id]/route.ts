import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employmentContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateEmploymentContractSchema = z.object({
  employeeId: z.string().uuid().optional(),
  contractNumber: z.string().min(1).max(50).optional(),
  contractType: z.enum(['indeterminate', 'determinate', 'part_time', 'internship', 'consultant']).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  probationEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  baseSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  currency: z.string().length(3).optional(),
  workingHoursPerWeek: z.number().int().min(1).max(168).optional(),
  workLocation: z.string().max(255).optional().nullable(),
  jobDescription: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'suspended']).optional(),
  terminationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  terminationReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const [contract] = await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.id, id))
      .limit(1);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employment-contracts/[id]', method: 'GET' });
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
    const validation = updateEmploymentContractSchema.safeParse(body);

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
    if (data.contractNumber !== undefined) updateData.contractNumber = data.contractNumber;
    if (data.contractType !== undefined) updateData.contractType = data.contractType;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.probationEndDate !== undefined) updateData.probationEndDate = data.probationEndDate;
    if (data.baseSalary !== undefined) updateData.baseSalary = data.baseSalary;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.workingHoursPerWeek !== undefined) updateData.workingHoursPerWeek = data.workingHoursPerWeek;
    if (data.workLocation !== undefined) updateData.workLocation = data.workLocation;
    if (data.jobDescription !== undefined) updateData.jobDescription = data.jobDescription;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.terminationDate !== undefined) updateData.terminationDate = data.terminationDate;
    if (data.terminationReason !== undefined) updateData.terminationReason = data.terminationReason;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedContract] = await db
      .update(employmentContracts)
      .set(updateData)
      .where(eq(employmentContracts.id, id))
      .returning();

    if (!updatedContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedContract,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employment-contracts/[id]', method: 'PUT' });
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
    const [deletedContract] = await db
      .delete(employmentContracts)
      .where(eq(employmentContracts.id, id))
      .returning();

    if (!deletedContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedContract,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employment-contracts/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

