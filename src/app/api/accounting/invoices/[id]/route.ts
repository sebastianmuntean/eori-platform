import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { invoices, parishes, clients, stockMovements } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { generateStockMovementsFromInvoice, reverseStockMovementsFromInvoice } from '@/lib/stock-movements';

const invoiceItemSchema = z.object({
  description: z.string(),
  quantity: z.number().positive(),
  unitPrice: z.number().nonnegative(),
  vat: z.number().nonnegative().optional().default(0),
  total: z.number().nonnegative(),
  productId: z.string().uuid().optional().nullable(),
  warehouseId: z.string().uuid().optional().nullable(),
  unitCost: z.number().nonnegative().optional().nullable(),
});

const updateInvoiceSchema = z.object({
  parishId: z.string().uuid().optional(),
  series: z.string().min(1).max(20).optional(),
  number: z.number().int().positive().optional(),
  invoiceNumber: z.string().min(1).max(50).optional(),
  type: z.enum(['issued', 'received']).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  clientId: z.string().uuid().optional(),
  items: z.array(invoiceItemSchema).optional(),
  currency: z.string().length(3).optional(),
  description: z.string().optional().nullable(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  warehouseId: z.string().uuid('Invalid warehouse ID').optional().nullable(),
});

/**
 * GET /api/accounting/invoices/[id] - Get invoice by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: GET /api/accounting/invoices/${id} - Fetching invoice`);

  try {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id))
      .limit(1);

    if (!invoice) {
      console.log(`❌ Invoice ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Invoice found: ${invoice.invoiceNumber}`);
    return NextResponse.json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error('❌ Error fetching invoice:', error);
    logError(error, { endpoint: '/api/accounting/invoices/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/accounting/invoices/[id] - Update invoice
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: PUT /api/accounting/invoices/${id} - Updating invoice`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateInvoiceSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

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

    // Check if client exists (if provided)
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

    // Handle series and number updates
    let updateData: any = { ...data, updatedAt: new Date(), updatedBy: userId };
    delete updateData.invoiceNumber; // We'll regenerate it if series/number changes
    
    // If series or number is being updated, regenerate invoiceNumber
    if (data.series !== undefined || data.number !== undefined) {
      const newSeries = data.series ?? existingInvoice.series;
      const newNumber = data.number ?? Number(existingInvoice.number);
      updateData.invoiceNumber = `${newSeries}-${String(newNumber).padStart(6, '0')}`;
      updateData.series = newSeries;
      updateData.number = newNumber.toString();
    }
    
    // Recalculate totals if items are being updated
    if (data.items && data.items.length > 0) {
      console.log('Step 4: Recalculating totals from items');
      const subtotal = data.items.reduce((sum, item) => sum + item.total, 0);
      const vatTotal = data.items.reduce((sum, item) => sum + (item.vat || 0), 0);
      const total = subtotal + vatTotal;
      
      updateData.amount = subtotal.toString();
      updateData.vat = vatTotal.toString();
      updateData.total = total.toString();
      updateData.items = data.items as any;

      // If invoice status is not cancelled, update stock movements
      if (data.status !== 'cancelled' && existingInvoice.status !== 'cancelled') {
        // Delete existing stock movements for this invoice
        await db.delete(stockMovements).where(eq(stockMovements.invoiceId, id));
        
        // Generate new stock movements
        try {
          await generateStockMovementsFromInvoice(
            id,
            data.type || existingInvoice.type,
            data.date || existingInvoice.date,
            data.items.map(item => ({
              ...item,
              productId: item.productId ?? undefined,
              warehouseId: item.warehouseId ?? undefined,
              unitCost: item.unitCost ?? undefined,
            })),
            data.parishId || existingInvoice.parishId,
            data.clientId || existingInvoice.clientId,
            userId
          );
          console.log('✓ Stock movements updated for invoice');
        } catch (stockError) {
          console.error('⚠ Error updating stock movements:', stockError);
        }
      }
    }

    // Handle status change to cancelled
    if (data.status === 'cancelled' && existingInvoice.status !== 'cancelled') {
      try {
        await reverseStockMovementsFromInvoice(id, userId);
        console.log('✓ Stock movements reversed for cancelled invoice');
      } catch (stockError) {
        console.error('⚠ Error reversing stock movements:', stockError);
      }
    }

    // Update invoice
    console.log('Step 5: Updating invoice');
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, id))
      .returning();

    if (!updatedInvoice) {
      console.log(`❌ Invoice ${id} not found after update`);
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Invoice updated successfully: ${updatedInvoice.id}`);
    return NextResponse.json({
      success: true,
      data: updatedInvoice,
    });
  } catch (error) {
    console.error('❌ Error updating invoice:', error);
    logError(error, { endpoint: '/api/accounting/invoices/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/accounting/invoices/[id] - Delete invoice
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: DELETE /api/accounting/invoices/${id} - Deleting invoice`);

  try {
    const { userId } = await getCurrentUser();
    
    // Reverse stock movements before deleting
    try {
      await reverseStockMovementsFromInvoice(id, userId || '');
      console.log('✓ Stock movements reversed for deleted invoice');
    } catch (stockError) {
      console.error('⚠ Error reversing stock movements:', stockError);
    }

    const [deletedInvoice] = await db
      .delete(invoices)
      .where(eq(invoices.id, id))
      .returning();

    if (!deletedInvoice) {
      console.log(`❌ Invoice ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Invoice not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Invoice deleted successfully: ${deletedInvoice.id}`);
    return NextResponse.json({
      success: true,
      data: deletedInvoice,
    });
  } catch (error) {
    console.error('❌ Error deleting invoice:', error);
    logError(error, { endpoint: '/api/accounting/invoices/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

