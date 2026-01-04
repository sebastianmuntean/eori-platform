import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryConcessionPayments, cemeteryConcessions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { validateUuid, validateDateRange } from '@/lib/utils/cemetery';

const updatePaymentSchema = z.object({
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  periodStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  periodEnd: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  receiptNumber: z.string().max(50).optional().nullable(),
  receiptDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication
    await requireAuth();

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    const [payment] = await db
      .select()
      .from(cemeteryConcessionPayments)
      .where(eq(cemeteryConcessionPayments.id, id))
      .limit(1);

    if (!payment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions/payments/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication and permission
    const { userId } = await requireAuth();
    await requirePermission('cemeteries.concessions.payments.update');

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updatePaymentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get current payment to validate period
    const [currentPayment] = await db
      .select()
      .from(cemeteryConcessionPayments)
      .where(eq(cemeteryConcessionPayments.id, id))
      .limit(1);

    if (!currentPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Validate period if being updated
    if (data.periodStart || data.periodEnd) {
      const [concession] = await db
        .select()
        .from(cemeteryConcessions)
        .where(eq(cemeteryConcessions.id, currentPayment.concessionId))
        .limit(1);

      if (concession) {
        const periodStart = data.periodStart || currentPayment.periodStart;
        const periodEnd = data.periodEnd || currentPayment.periodEnd;

        // Business rule validation: period must be within concession period
        if (periodStart < concession.startDate || periodEnd > concession.expiryDate) {
          return NextResponse.json(
            { success: false, error: 'Payment period must be within concession period' },
            { status: 400 }
          );
        }

        // Business rule validation: periodStart must be <= periodEnd
        const dateRangeValidation = validateDateRange(periodStart, periodEnd);
        if (!dateRangeValidation.valid) {
          return NextResponse.json(
            { success: false, error: dateRangeValidation.error },
            { status: 400 }
          );
        }
      }
    }

    // Build update data with proper typing
    const updateData: {
      updatedAt?: Date;
      updatedBy?: string;
      paymentDate?: string;
      amount?: string;
      currency?: string;
      periodStart?: string;
      periodEnd?: string;
      receiptNumber?: string | null;
      receiptDate?: string | null;
      notes?: string | null;
    } = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    if (data.paymentDate !== undefined) updateData.paymentDate = data.paymentDate;
    if (data.amount !== undefined) updateData.amount = data.amount.toString();
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.periodStart !== undefined) updateData.periodStart = data.periodStart;
    if (data.periodEnd !== undefined) updateData.periodEnd = data.periodEnd;
    if (data.receiptNumber !== undefined) updateData.receiptNumber = data.receiptNumber;
    if (data.receiptDate !== undefined) updateData.receiptDate = data.receiptDate;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedPayment] = await db
      .update(cemeteryConcessionPayments)
      .set(updateData)
      .where(eq(cemeteryConcessionPayments.id, id))
      .returning();

    if (!updatedPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedPayment,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions/payments/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require authentication and permission
    await requireAuth();
    await requirePermission('cemeteries.concessions.payments.delete');

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    const [deletedPayment] = await db
      .delete(cemeteryConcessionPayments)
      .where(eq(cemeteryConcessionPayments.id, id))
      .returning();

    if (!deletedPayment) {
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedPayment,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/concessions/payments/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

