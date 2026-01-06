import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { inventorySessions, inventoryItems, stockMovements, parishes, warehouses } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq } from 'drizzle-orm';

/**
 * POST /api/pangare/inventar/[id]/complete - Complete inventory session and generate adjustments
 */
export async function POST(
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

    // Get session
    const [session] = await db
      .select()
      .from(inventorySessions)
      .where(eq(inventorySessions.id, id))
      .limit(1);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Inventory session not found' },
        { status: 404 }
      );
    }

    if (session.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Session is already completed' },
        { status: 400 }
      );
    }

    // Validate warehouse is present (required for product adjustments)
    if (!session.warehouseId) {
      return NextResponse.json(
        { success: false, error: 'Cannot complete session without a warehouse' },
        { status: 400 }
      );
    }

    // Get all items with differences
    const items = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.sessionId, id));

    const itemsWithDifferences = items.filter(item => {
      const bookQty = item.bookQuantity ? parseFloat(item.bookQuantity.toString()) : 0;
      const physicalQty = item.physicalQuantity ? parseFloat(item.physicalQuantity.toString()) : 0;
      return Math.abs(bookQty - physicalQty) > 0.001; // Account for floating point precision
    });

    // Use transaction to ensure data consistency
    const result = await db.transaction(async (tx) => {
      const movementsCreated: string[] = [];

      // Generate stock movements for products with differences
      for (const item of itemsWithDifferences) {
        if (item.itemType === 'product') {
          const bookQty = item.bookQuantity ? parseFloat(item.bookQuantity.toString()) : 0;
          const physicalQty = item.physicalQuantity ? parseFloat(item.physicalQuantity.toString()) : 0;
          const difference = physicalQty - bookQty;

          if (Math.abs(difference) < 0.001) continue; // Skip negligible differences

          // Use 'in' for increases and 'out' for decreases to properly reflect stock changes
          // 'adjustment' type might not handle negative differences correctly in stock calculations
          const movementType = difference > 0 ? 'in' : 'out';
          const quantity = Math.abs(difference).toFixed(3);

          const [movement] = await tx
            .insert(stockMovements)
            .values({
              warehouseId: session.warehouseId!,
              productId: item.itemId,
              parishId: session.parishId,
              type: movementType,
              movementDate: session.date,
              quantity,
              notes: `Inventory adjustment from session ${id}: ${difference > 0 ? 'Increase' : 'Decrease'} of ${quantity}`,
              documentType: 'inventory_adjustment',
              documentNumber: id,
              createdBy: userId,
            })
            .returning({ id: stockMovements.id });

          if (movement) {
            movementsCreated.push(movement.id);
          }
        }
        // Note: Fixed assets adjustments would be handled differently (status changes, etc.)
      }

      // Update session status to completed
      const [updatedSession] = await tx
        .update(inventorySessions)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(inventorySessions.id, id))
        .returning();

      if (!updatedSession) {
        throw new Error('Failed to update session status');
      }

      return { updatedSession, movementsCreated };
    });

    return NextResponse.json({
      success: true,
      data: result.updatedSession,
      adjustmentsCreated: result.movementsCreated.length,
    });
  } catch (error) {
    console.error('❌ Error completing inventory session:', error);
    logError(error, { endpoint: '/api/pangare/inventar/[id]/complete', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

