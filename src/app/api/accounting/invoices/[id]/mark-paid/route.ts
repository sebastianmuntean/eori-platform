import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { invoices } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { eq } from 'drizzle-orm';

/**
 * POST /api/accounting/invoices/[id]/mark-paid - Mark invoice as paid
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/accounting/invoices/${id}/mark-paid - Marking invoice as paid`);

  try {
    // Check if invoice exists
    const [existingInvoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!existingInvoice) {
      console.log(`❌ Invoice ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Update invoice status to 'paid' and set paymentDate
    console.log('Step 2: Updating invoice status to paid');
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        status: 'paid',
        paymentDate: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning();

    if (!updatedInvoice) {
      console.log(`❌ Invoice ${id} not found after update`);
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Invoice marked as paid successfully: ${updatedInvoice.id}`);
    return NextResponse.json({
      success: true,
      data: updatedInvoice,
    });
  } catch (error) {
    console.error('❌ Error marking invoice as paid:', error);
    logError(error, { endpoint: '/api/accounting/invoices/[id]/mark-paid', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



