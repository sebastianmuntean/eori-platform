import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { inventorySessions, inventoryItems, parishes, warehouses, users } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

const updateInventorySessionSchema = z.object({
  warehouseId: z.string().uuid('Invalid warehouse ID').optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  status: z.enum(['draft', 'in_progress', 'completed', 'cancelled']).optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pangare/inventar/[id] - Get inventory session by ID with items
 */
export async function GET(
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

    // Get items
    const items = await db
      .select()
      .from(inventoryItems)
      .where(eq(inventoryItems.sessionId, id));

    // Enrich session data
    const [parish] = await db
      .select({ id: parishes.id, name: parishes.name })
      .from(parishes)
      .where(eq(parishes.id, session.parishId))
      .limit(1);

    const warehouseResult = session.warehouseId ? await db
      .select({ id: warehouses.id, name: warehouses.name })
      .from(warehouses)
      .where(eq(warehouses.id, session.warehouseId))
      .limit(1) : [];
    const warehouse = warehouseResult.length > 0 ? warehouseResult[0] : null;

    const [createdByUser] = await db
      .select({ id: users.id, name: users.name })
      .from(users)
      .where(eq(users.id, session.createdBy))
      .limit(1);

    return NextResponse.json({
      success: true,
      data: {
        ...session,
        items,
        parish: parish || null,
        warehouse: warehouse,
        createdByUser: createdByUser || null,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching inventory session:', error);
    logError(error, { endpoint: '/api/pangare/inventar/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/pangare/inventar/[id] - Update inventory session
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
    const validation = updateInventorySessionSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if session exists
    const [existingSession] = await db
      .select()
      .from(inventorySessions)
      .where(eq(inventorySessions.id, id))
      .limit(1);

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Inventory session not found' },
        { status: 404 }
      );
    }

    // Don't allow updating completed or cancelled sessions
    if (existingSession.status === 'completed' || existingSession.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Cannot update completed or cancelled sessions' },
        { status: 400 }
      );
    }

    // Validate warehouse if provided
    if (data.warehouseId) {
      const [warehouse] = await db
        .select()
        .from(warehouses)
        .where(eq(warehouses.id, data.warehouseId))
        .limit(1);

      if (!warehouse) {
        return NextResponse.json(
          { success: false, error: 'Warehouse not found' },
          { status: 400 }
        );
      }
    }

    // Update session
    const updateData: any = {};

    if (data.warehouseId !== undefined) updateData.warehouseId = data.warehouseId;
    if (data.date) updateData.date = data.date;
    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedSession] = await db
      .update(inventorySessions)
      .set(updateData)
      .where(eq(inventorySessions.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedSession,
    });
  } catch (error) {
    console.error('❌ Error updating inventory session:', error);
    logError(error, { endpoint: '/api/pangare/inventar/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/pangare/inventar/[id] - Delete inventory session
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

    // Check if session exists
    const [existingSession] = await db
      .select()
      .from(inventorySessions)
      .where(eq(inventorySessions.id, id))
      .limit(1);

    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: 'Inventory session not found' },
        { status: 404 }
      );
    }

    // Don't allow deleting completed sessions
    if (existingSession.status === 'completed') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete completed sessions' },
        { status: 400 }
      );
    }

    // Delete session (items will be cascade deleted)
    await db
      .delete(inventorySessions)
      .where(eq(inventorySessions.id, id));

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('❌ Error deleting inventory session:', error);
    logError(error, { endpoint: '/api/pangare/inventar/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

