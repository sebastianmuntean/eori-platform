import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { parishionerContracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * POST /api/parishioners/contracts/[id]/renew - Create a renewed contract
 */
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
    const { startDate, endDate, amount } = body;

    // Check if contract exists
    const [originalContract] = await db
      .select()
      .from(parishionerContracts)
      .where(eq(parishionerContracts.id, id))
      .limit(1);

    if (!originalContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (originalContract.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Only active contracts can be renewed' },
        { status: 400 }
      );
    }

    // Use transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Create new contract based on original
      const [newContract] = await tx
        .insert(parishionerContracts)
        .values({
          parishId: originalContract.parishId,
          contractNumber: `${originalContract.contractNumber}-RENEWED-${Date.now()}`,
          parishionerId: originalContract.parishionerId,
          contractType: originalContract.contractType,
          status: 'active',
          title: originalContract.title,
          startDate: startDate || originalContract.endDate || originalContract.startDate,
          endDate: endDate || originalContract.endDate,
          signingDate: new Date().toISOString().split('T')[0],
          amount: amount || originalContract.amount,
          currency: originalContract.currency || 'RON',
          terms: originalContract.terms,
          description: originalContract.description,
          notes: originalContract.notes,
          renewalDate: originalContract.endDate || originalContract.startDate,
          autoRenewal: originalContract.autoRenewal,
          parentContractId: originalContract.id,
          createdBy: userId,
        })
        .returning();

      // Update original contract status to 'renewed'
      await tx
        .update(parishionerContracts)
        .set({
          status: 'renewed',
          updatedBy: userId,
        })
        .where(eq(parishionerContracts.id, id));

      return newContract;
    });

    const newContract = result;

    return NextResponse.json({
      success: true,
      data: newContract,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/contracts/[id]/renew', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

