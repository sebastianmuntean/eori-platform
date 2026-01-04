import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { contracts } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * POST /api/accounting/contracts/[id]/renew - Create a renewed contract
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/accounting/contracts/${id}/renew - Renewing contract`);

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
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (!originalContract) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    if (originalContract.status !== 'active') {
      console.log(`❌ Contract ${id} is not active, cannot be renewed`);
      return NextResponse.json(
        { success: false, error: 'Only active contracts can be renewed' },
        { status: 400 }
      );
    }

    // Create new contract based on original
    console.log('Step 2: Creating renewed contract');
    const [newContract] = await db
      .insert(contracts)
      .values({
        parishId: originalContract.parishId,
        contractNumber: `${originalContract.contractNumber}-RENEWED-${Date.now()}`,
        direction: originalContract.direction,
        type: originalContract.type,
        status: 'active',
        partnerId: originalContract.partnerId,
        title: originalContract.title,
        startDate: startDate || originalContract.endDate, // New start date
        endDate: endDate || originalContract.endDate, // New end date
        signingDate: new Date().toISOString().split('T')[0],
        amount: amount || originalContract.amount,
        currency: originalContract.currency || 'RON',
        paymentFrequency: originalContract.paymentFrequency,
        assetReference: originalContract.assetReference,
        description: originalContract.description,
        terms: originalContract.terms,
        notes: originalContract.notes,
        renewalDate: originalContract.endDate,
        autoRenewal: originalContract.autoRenewal,
        parentContractId: originalContract.id, // Link to original contract
        createdBy: userId,
      })
      .returning();

    // Update original contract status to 'renewed'
    console.log('Step 3: Updating original contract status');
    await db
      .update(contracts)
      .set({
        status: 'renewed',
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(contracts.id, id));

    console.log(`✓ Contract renewed successfully: ${newContract.id}`);
    return NextResponse.json({
      success: true,
      data: newContract,
    });
  } catch (error) {
    console.error('❌ Error renewing contract:', error);
    logError(error, { endpoint: '/api/accounting/contracts/[id]/renew', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



