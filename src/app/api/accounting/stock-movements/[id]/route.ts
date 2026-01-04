import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { stockMovements, warehouses, products } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateStockMovementSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID').optional(),
  productId: z.string().uuid('Invalid product ID').optional(),
  type: z.enum(['in', 'out', 'transfer', 'adjustment', 'return']).optional(),
  movementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Movement date must be in YYYY-MM-DD format').optional(),
  quantity: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Quantity must be a valid number').optional(),
  unitCost: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Unit cost must be a valid number').optional().nullable(),
  totalValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Total value must be a valid number').optional().nullable(),
  documentType: z.string().max(50).optional().nullable(),
  documentNumber: z.string().max(50).optional().nullable(),
  documentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Document date must be in YYYY-MM-DD format').optional().nullable(),
  clientId: z.string().uuid('Invalid client ID').optional().nullable(),
  destinationWarehouseId: z.string().uuid('Invalid destination warehouse ID').optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/accounting/stock-movements/:id - Get stock movement by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [movement] = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.id, id))
      .limit(1);

    if (!movement) {
      return NextResponse.json(
        { success: false, error: 'Stock movement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: movement,
    });
  } catch (error) {
    console.error('❌ Error fetching stock movement:', error);
    logError(error, { endpoint: '/api/accounting/stock-movements/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/accounting/stock-movements/:id - Update stock movement
 * Note: Movements linked to invoices cannot be edited
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateStockMovementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if movement exists
    const [existingMovement] = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.id, id))
      .limit(1);

    if (!existingMovement) {
      return NextResponse.json(
        { success: false, error: 'Stock movement not found' },
        { status: 404 }
      );
    }

    // Don't allow editing movements linked to invoices
    if (existingMovement.invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Cannot edit stock movements linked to invoices. Cancel the invoice instead.' },
        { status: 400 }
      );
    }

    // Calculate total value if not provided
    let totalValue = data.totalValue;
    if (!totalValue && data.unitCost && data.quantity) {
      totalValue = (parseFloat(data.quantity) * parseFloat(data.unitCost)).toFixed(2);
    } else if (!totalValue && existingMovement.unitCost && data.quantity) {
      totalValue = (parseFloat(data.quantity) * parseFloat(existingMovement.unitCost as string)).toFixed(2);
    } else if (!totalValue && data.unitCost && existingMovement.quantity) {
      totalValue = (parseFloat(existingMovement.quantity as string) * parseFloat(data.unitCost)).toFixed(2);
    }

    // Update movement
    const [updatedMovement] = await db
      .update(stockMovements)
      .set({
        ...data,
        totalValue: totalValue || existingMovement.totalValue,
      })
      .where(eq(stockMovements.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedMovement,
    });
  } catch (error) {
    console.error('❌ Error updating stock movement:', error);
    logError(error, { endpoint: '/api/accounting/stock-movements/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/accounting/stock-movements/:id - Delete stock movement
 * Note: Movements linked to invoices cannot be deleted
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if movement exists
    const [existingMovement] = await db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.id, id))
      .limit(1);

    if (!existingMovement) {
      return NextResponse.json(
        { success: false, error: 'Stock movement not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting movements linked to invoices
    if (existingMovement.invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete stock movements linked to invoices. Cancel the invoice instead.' },
        { status: 400 }
      );
    }

    // Delete movement
    await db
      .delete(stockMovements)
      .where(eq(stockMovements.id, id));

    return NextResponse.json({
      success: true,
      message: 'Stock movement deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting stock movement:', error);
    logError(error, { endpoint: '/api/accounting/stock-movements/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

