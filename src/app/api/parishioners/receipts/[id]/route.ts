import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { receipts, receiptAttachments, clients, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { deleteParishionerFile } from '@/lib/services/parishioner-file-service';

const updateReceiptSchema = z.object({
  receiptNumber: z.string().min(1, 'Receipt number is required').max(50).optional(),
  parishionerId: z.string().uuid('Invalid parishioner ID').optional(),
  parishId: z.string().uuid('Invalid parish ID').optional(),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Receipt date must be in YYYY-MM-DD format').optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid number').optional(),
  currency: z.string().length(3).optional(),
  purpose: z.string().optional().nullable(),
  paymentMethod: z.string().max(50).optional().nullable(),
  status: z.enum(['draft', 'issued', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/parishioners/receipts/[id] - Get a single receipt
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, id))
      .limit(1);

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: receipt,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/parishioners/receipts/[id] - Update a receipt
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
    const validation = updateReceiptSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if receipt exists
    const [existingReceipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, id))
      .limit(1);

    if (!existingReceipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Check if receipt number is being changed and if it already exists
    if (data.receiptNumber && data.receiptNumber !== existingReceipt.receiptNumber) {
      const [duplicateReceipt] = await db
        .select()
        .from(receipts)
        .where(eq(receipts.receiptNumber, data.receiptNumber))
        .limit(1);

      if (duplicateReceipt) {
        return NextResponse.json(
          { success: false, error: 'Receipt with this number already exists' },
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

    if (data.receiptNumber !== undefined) updateData.receiptNumber = data.receiptNumber;
    if (data.parishionerId !== undefined) updateData.parishionerId = data.parishionerId;
    if (data.parishId !== undefined) updateData.parishId = data.parishId;
    if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.purpose !== undefined) updateData.purpose = data.purpose;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.status !== undefined) {
      updateData.status = data.status;
      // Set issuedBy when status changes to 'issued'
      if (data.status === 'issued' && existingReceipt.status !== 'issued') {
        updateData.issuedBy = userId;
      }
    }
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedReceipt] = await db
      .update(receipts)
      .set(updateData)
      .where(eq(receipts.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedReceipt,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/parishioners/receipts/[id] - Delete a receipt
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

    const [receipt] = await db
      .select()
      .from(receipts)
      .where(eq(receipts.id, id))
      .limit(1);

    if (!receipt) {
      return NextResponse.json(
        { success: false, error: 'Receipt not found' },
        { status: 404 }
      );
    }

    // Get all attachments and delete files
    const attachments = await db
      .select()
      .from(receiptAttachments)
      .where(eq(receiptAttachments.receiptId, id));

    // Delete files from filesystem
    for (const attachment of attachments) {
      await deleteParishionerFile(attachment.storagePath);
    }

    // Delete attachments from database (cascade should handle this, but explicit for clarity)
    await db.delete(receiptAttachments).where(eq(receiptAttachments.receiptId, id));

    // Delete receipt
    await db.delete(receipts).where(eq(receipts.id, id));

    return NextResponse.json({
      success: true,
      message: 'Receipt deleted successfully',
    });
  } catch (error) {
    logError(error, { endpoint: '/api/parishioners/receipts/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

