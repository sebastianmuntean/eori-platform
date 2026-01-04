import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { stockMovements, warehouses, products } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';

const transferStockSchema = z.object({
  sourceWarehouseId: z.string().uuid('Invalid source warehouse ID'),
  destinationWarehouseId: z.string().uuid('Invalid destination warehouse ID'),
  productId: z.string().uuid('Invalid product ID'),
  parishId: z.string().uuid('Invalid parish ID'),
  movementDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Movement date must be in YYYY-MM-DD format'),
  quantity: z.string().regex(/^\d+(\.\d{1,3})?$/, 'Quantity must be a valid number'),
  unitCost: z.string().regex(/^\d+(\.\d{1,4})?$/, 'Unit cost must be a valid number').optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/accounting/stock-movements/transfer - Transfer stock between warehouses
 */
export async function POST(request: Request) {
  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = transferStockSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Validate source and destination are different
    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      return NextResponse.json(
        { success: false, error: 'Source and destination warehouses must be different' },
        { status: 400 }
      );
    }

    // Validate warehouses exist
    const [sourceWarehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, data.sourceWarehouseId))
      .limit(1);

    if (!sourceWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Source warehouse not found' },
        { status: 400 }
      );
    }

    const [destWarehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, data.destinationWarehouseId))
      .limit(1);

    if (!destWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Destination warehouse not found' },
        { status: 400 }
      );
    }

    // Validate product exists and tracks stock
    const [existingProduct] = await db
      .select()
      .from(products)
      .where(eq(products.id, data.productId))
      .limit(1);

    if (!existingProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 400 }
      );
    }

    if (!existingProduct.trackStock) {
      return NextResponse.json(
        { success: false, error: 'Product does not track stock' },
        { status: 400 }
      );
    }

    // Check stock availability in source warehouse
    const stockResult = await db
      .select({
        quantity: sql<number>`COALESCE(SUM(CASE 
          WHEN type = 'in' THEN quantity::numeric
          WHEN type = 'out' THEN -quantity::numeric
          WHEN type = 'transfer' AND destination_warehouse_id IS NOT NULL THEN -quantity::numeric
          WHEN type = 'transfer' AND destination_warehouse_id IS NULL THEN quantity::numeric
          WHEN type = 'adjustment' THEN quantity::numeric
          WHEN type = 'return' THEN quantity::numeric
          ELSE 0
        END), 0)`,
      })
      .from(stockMovements)
      .where(
        and(
          eq(stockMovements.warehouseId, data.sourceWarehouseId),
          eq(stockMovements.productId, data.productId)
        )
      );

    const currentStock = Number(stockResult[0]?.quantity || 0);
    const requestedQuantity = parseFloat(data.quantity);

    if (currentStock < requestedQuantity) {
      return NextResponse.json(
        { success: false, error: `Insufficient stock in source warehouse. Available: ${currentStock}, Requested: ${requestedQuantity}` },
        { status: 400 }
      );
    }

    // Calculate total value
    let totalValue = null;
    if (data.unitCost) {
      totalValue = (parseFloat(data.quantity) * parseFloat(data.unitCost)).toFixed(2);
    }

    // Create out movement from source warehouse
    const [outMovement] = await db
      .insert(stockMovements)
      .values({
        warehouseId: data.sourceWarehouseId,
        productId: data.productId,
        parishId: data.parishId,
        type: 'transfer',
        movementDate: data.movementDate,
        quantity: data.quantity,
        unitCost: data.unitCost || null,
        totalValue: totalValue,
        destinationWarehouseId: data.destinationWarehouseId,
        notes: data.notes || `Transfer to ${destWarehouse.name}`,
        createdBy: userId,
      })
      .returning();

    // Create in movement to destination warehouse
    const [inMovement] = await db
      .insert(stockMovements)
      .values({
        warehouseId: data.destinationWarehouseId,
        productId: data.productId,
        parishId: data.parishId,
        type: 'in',
        movementDate: data.movementDate,
        quantity: data.quantity,
        unitCost: data.unitCost || null,
        totalValue: totalValue,
        documentType: 'transfer',
        documentNumber: outMovement.id,
        documentDate: data.movementDate,
        notes: data.notes || `Transfer from ${sourceWarehouse.name}`,
        createdBy: userId,
      })
      .returning();

    return NextResponse.json({
      success: true,
      data: {
        outMovement,
        inMovement,
      },
    });
  } catch (error) {
    console.error('❌ Error transferring stock:', error);
    logError(error, { endpoint: '/api/accounting/stock-movements/transfer', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

