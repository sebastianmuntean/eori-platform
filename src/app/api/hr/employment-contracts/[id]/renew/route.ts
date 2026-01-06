import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { employmentContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const renewContractSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  baseSalary: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  contractNumber: z.string().max(50).optional(),
});

export async function POST(
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
    const validation = renewContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get existing contract
    const [existingContract] = await db
      .select()
      .from(employmentContracts)
      .where(eq(employmentContracts.id, id))
      .limit(1);

    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Generate new contract number if not provided
    const contractNumber = data.contractNumber || `${existingContract.contractNumber}-RENEW`;

    // Create new contract based on existing one
    const [newContract] = await db
      .insert(employmentContracts)
      .values({
        employeeId: existingContract.employeeId,
        contractNumber,
        contractType: existingContract.contractType,
        startDate: data.startDate,
        endDate: data.endDate || null,
        probationEndDate: null,
        baseSalary: data.baseSalary || existingContract.baseSalary,
        currency: existingContract.currency,
        workingHoursPerWeek: existingContract.workingHoursPerWeek,
        workLocation: existingContract.workLocation,
        jobDescription: existingContract.jobDescription,
        status: 'draft',
        notes: `Renewed from contract ${existingContract.contractNumber}`,
        createdBy: userId,
      })
      .returning();

    // Update old contract status to expired
    await db
      .update(employmentContracts)
      .set({
        status: 'expired',
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(employmentContracts.id, id));

    return NextResponse.json({
      success: true,
      data: newContract,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/hr/employment-contracts/[id]/renew', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}




