import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { contracts, parishes, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateContractSchema = z.object({
  parishId: z.string().uuid().optional(),
  contractNumber: z.string().min(1).max(50).optional(),
  direction: z.enum(['incoming', 'outgoing']).optional(),
  type: z.enum(['rental', 'concession', 'sale_purchase', 'loan', 'other']).optional(),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'renewed']).optional(),
  clientId: z.string().uuid().optional(),
  title: z.string().max(255).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  signingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
  currency: z.string().length(3).optional(),
  paymentFrequency: z.enum(['monthly', 'quarterly', 'semiannual', 'annual', 'one_time', 'custom']).optional(),
  assetReference: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  renewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  autoRenewal: z.boolean().optional(),
  parentContractId: z.string().uuid().optional().nullable(),
  invoiceItemTemplate: z.any().optional().nullable(), // Template for invoice line items
});

/**
 * GET /api/accounting/contracts/[id] - Get contract by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/accounting/contracts/${id} - Fetching contract`);

  try {
    const [contract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (!contract) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Contract found: ${contract.contractNumber}`);
    return NextResponse.json({
      success: true,
      data: contract,
    });
  } catch (error) {
    console.error('❌ Error fetching contract:', error);
    logError(error, { endpoint: '/api/accounting/contracts/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/accounting/contracts/[id] - Update contract
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: PUT /api/accounting/contracts/${id} - Updating contract`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateContractSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if contract exists
    const [existingContract] = await db
      .select()
      .from(contracts)
      .where(eq(contracts.id, id))
      .limit(1);

    if (!existingContract) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if parish exists (if being updated)
    if (data.parishId) {
      console.log(`Step 2: Checking if parish ${data.parishId} exists`);
      const [existingParish] = await db
        .select()
        .from(parishes)
        .where(eq(parishes.id, data.parishId))
        .limit(1);

      if (!existingParish) {
        console.log(`❌ Parish ${data.parishId} not found`);
        return NextResponse.json(
          { success: false, error: 'Parish not found' },
          { status: 400 }
        );
      }
    }

    // Check if client exists (if being updated)
    if (data.clientId) {
      console.log(`Step 3: Checking if client ${data.clientId} exists`);
      const [existingClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, data.clientId))
        .limit(1);

      if (!existingClient) {
        console.log(`❌ Client ${data.clientId} not found`);
        return NextResponse.json(
          { success: false, error: 'Client not found' },
          { status: 400 }
        );
      }
    }

    // Check if parent contract exists (if being updated)
    if (data.parentContractId) {
      console.log(`Step 4: Checking if parent contract ${data.parentContractId} exists`);
      const [existingParentContract] = await db
        .select()
        .from(contracts)
        .where(eq(contracts.id, data.parentContractId))
        .limit(1);

      if (!existingParentContract) {
        console.log(`❌ Parent contract ${data.parentContractId} not found`);
        return NextResponse.json(
          { success: false, error: 'Parent contract not found' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    // Update contract
    console.log('Step 5: Updating contract');
    const [updatedContract] = await db
      .update(contracts)
      .set(updateData)
      .where(eq(contracts.id, id))
      .returning();

    if (!updatedContract) {
      console.log(`❌ Contract ${id} not found after update`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Contract updated successfully: ${updatedContract.id}`);
    return NextResponse.json({
      success: true,
      data: updatedContract,
    });
  } catch (error) {
    console.error('❌ Error updating contract:', error);
    logError(error, { endpoint: '/api/accounting/contracts/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/accounting/contracts/[id] - Delete contract
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: DELETE /api/accounting/contracts/${id} - Deleting contract`);

  try {
    const [deletedContract] = await db
      .delete(contracts)
      .where(eq(contracts.id, id))
      .returning();

    if (!deletedContract) {
      console.log(`❌ Contract ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Contract deleted successfully: ${deletedContract.id}`);
    return NextResponse.json({
      success: true,
      data: deletedContract,
    });
  } catch (error) {
    console.error('❌ Error deleting contract:', error);
    logError(error, { endpoint: '/api/accounting/contracts/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

