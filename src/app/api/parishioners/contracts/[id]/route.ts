import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { parishionerContracts, contractDocuments, clients, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { deleteParishionerFile } from '@/lib/services/parishioner-file-service';

const updateContractSchema = z.object({
  contractNumber: z.string().min(1).max(50).optional(),
  parishionerId: z.string().uuid().optional(),
  parishId: z.string().uuid().optional(),
  contractType: z.enum(['donation', 'service', 'rental', 'other']).optional(),
  status: z.enum(['draft', 'active', 'expired', 'terminated', 'renewed']).optional(),
  title: z.string().max(255).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  signingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  currency: z.string().length(3).optional(),
  terms: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  renewalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  autoRenewal: z.boolean().optional(),
  parentContractId: z.string().uuid().optional().nullable(),
});

/**
 * GET /api/parishioners/contracts/[id] - Get contract by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [contract] = await db
      .select()
      .from(parishionerContracts)
      .where(eq(parishionerContracts.id, id))
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
    logError(error, { endpoint: '/api/parishioners/contracts/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/parishioners/contracts/[id] - Update contract
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateContractSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if contract exists
    const [existingContract] = await db
      .select()
      .from(parishionerContracts)
      .where(eq(parishionerContracts.id, id))
      .limit(1);

    if (!existingContract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Check if contract number is being changed and if it already exists
    if (data.contractNumber && data.contractNumber !== existingContract.contractNumber) {
      const [duplicateContract] = await db
        .select()
        .from(parishionerContracts)
        .where(eq(parishionerContracts.contractNumber, data.contractNumber))
        .limit(1);

      if (duplicateContract) {
        return NextResponse.json(
          { success: false, error: 'Contract with this number already exists' },
          { status: 400 }
        );
      }
    }

    // Verify parishioner exists if being updated
    if (data.parishionerId) {
      const [parishioner] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, data.parishionerId))
        .limit(1);

      if (!parishioner) {
        return NextResponse.json(
          { success: false, error: 'Parishioner not found' },
          { status: 404 }
        );
      }
    }

    // Verify parish exists if being updated
    if (data.parishId) {
      const [parish] = await db
        .select()
        .from(parishes)
        .where(eq(parishes.id, data.parishId))
        .limit(1);

      if (!parish) {
        return NextResponse.json(
          { success: false, error: 'Parish not found' },
          { status: 404 }
        );
      }
    }

    const updateData: any = {
      updatedBy: userId,
    };

    if (data.contractNumber !== undefined) updateData.contractNumber = data.contractNumber;
    if (data.parishionerId !== undefined) updateData.parishionerId = data.parishionerId;
    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.contractType !== undefined) updateData.contractType = data.contractType;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.startDate !== undefined) updateData.startDate = data.startDate;
    if (data.endDate !== undefined) updateData.endDate = data.endDate;
    if (data.signingDate !== undefined) updateData.signingDate = data.signingDate;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.terms !== undefined) updateData.terms = data.terms;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.renewalDate !== undefined) updateData.renewalDate = data.renewalDate;
    if (data.autoRenewal !== undefined) updateData.autoRenewal = data.autoRenewal;
    if (data.parentContractId !== undefined) updateData.parentContractId = data.parentContractId;

    const [updatedContract] = await db
      .update(parishionerContracts)
      .set(updateData)
      .where(eq(parishionerContracts.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedContract,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/contracts/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/parishioners/contracts/[id] - Delete contract
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
    }

    const { id } = await params;

    const [contract] = await db
      .select()
      .from(parishionerContracts)
      .where(eq(parishionerContracts.id, id))
      .limit(1);

    if (!contract) {
      return NextResponse.json(
        { success: false, error: 'Contract not found' },
        { status: 404 }
      );
    }

    // Get all documents and delete files
    const documents = await db
      .select()
      .from(contractDocuments)
      .where(eq(contractDocuments.contractId, id));

    // Delete files from filesystem
    for (const document of documents) {
      await deleteParishionerFile(document.storagePath);
    }

    // Delete documents from database (cascade should handle this, but explicit for clarity)
    await db.delete(contractDocuments).where(eq(contractDocuments.contractId, id));

    // Delete contract
    await db.delete(parishionerContracts).where(eq(parishionerContracts.id, id));

    return NextResponse.json({
      success: true,
      message: 'Contract deleted successfully',
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/contracts/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

