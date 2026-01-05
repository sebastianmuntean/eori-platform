import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { payments, parishes, clients } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updatePaymentSchema = z.object({
  parishId: z.string().uuid().optional(),
  paymentNumber: z.string().min(1).max(50).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().max(100).optional().nullable(),
  clientId: z.string().uuid().optional().nullable(),
  amount: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  description: z.string().optional().nullable(),
  paymentMethod: z.enum(['cash', 'bank_transfer', 'card', 'check']).optional().nullable(),
  referenceNumber: z.string().max(100).optional().nullable(),
  status: z.enum(['pending', 'completed', 'cancelled']).optional(),
});

/**
 * GET /api/accounting/payments/[id] - Get payment by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/accounting/payments/${id} - Fetching payment`);

  try {
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (!payment) {
      console.log(`❌ Payment ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Payment found: ${payment.paymentNumber}`);
    return NextResponse.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error('❌ Error fetching payment:', error);
    logError(error, { endpoint: '/api/accounting/payments/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/accounting/payments/[id] - Update payment
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: PUT /api/accounting/payments/${id} - Updating payment`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updatePaymentSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if payment exists
    const [existingPayment] = await db
      .select()
      .from(payments)
      .where(eq(payments.id, id))
      .limit(1);

    if (!existingPayment) {
      console.log(`❌ Payment ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
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

    // Check if partner exists (if provided)
    if (data.clientId !== undefined && data.clientId !== null) {
      console.log(`Step 3: Checking if client ${data.clientId} exists`);
      const [existingClient] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, data.clientId))
        .limit(1);

      if (!existingClient) {
        console.log(`❌ Client ${data.clientId} not found`);
        return NextResponse.json(
          { success: false, error: 'Partner not found' },
          { status: 400 }
        );
      }
    }

    // Update payment
    console.log('Step 4: Updating payment');
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    // Convert amount to string if provided
    if (data.amount !== undefined) {
      updateData.amount = data.amount.toString();
    }

    const [updatedPayment] = await db
      .update(payments)
      .set(updateData)
      .where(eq(payments.id, id))
      .returning();

    if (!updatedPayment) {
      console.log(`❌ Payment ${id} not found after update`);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Payment updated successfully: ${updatedPayment.id}`);
    return NextResponse.json({
      success: true,
      data: updatedPayment,
    });
  } catch (error) {
    console.error('❌ Error updating payment:', error);
    logError(error, { endpoint: '/api/accounting/payments/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/accounting/payments/[id] - Delete payment
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: DELETE /api/accounting/payments/${id} - Deleting payment`);

  try {
    const [deletedPayment] = await db
      .delete(payments)
      .where(eq(payments.id, id))
      .returning();

    if (!deletedPayment) {
      console.log(`❌ Payment ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Payment not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Payment deleted successfully: ${deletedPayment.id}`);
    return NextResponse.json({
      success: true,
      data: deletedPayment,
    });
  } catch (error) {
    console.error('❌ Error deleting payment:', error);
    logError(error, { endpoint: '/api/accounting/payments/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



