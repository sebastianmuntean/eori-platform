import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { warehouses } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';

const updateWarehouseSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20).optional(),
  name: z.string().min(1, 'Name is required').max(255).optional(),
  type: z.enum(['general', 'retail', 'storage', 'temporary']).optional(),
  address: z.string().optional().nullable(),
  responsibleName: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email('Invalid email').max(255).optional().nullable(),
  invoiceSeries: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

/**
 * GET /api/accounting/warehouses/:id - Get warehouse by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1);

    if (!warehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: warehouse,
    });
  } catch (error) {
    console.error('❌ Error fetching warehouse:', error);
    logError(error, { endpoint: '/api/accounting/warehouses/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/accounting/warehouses/:id - Update warehouse
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
    const validation = updateWarehouseSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if warehouse exists
    const [existingWarehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1);

    if (!existingWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // If code is being updated, check if it conflicts with another warehouse
    if (data.code && data.code !== existingWarehouse.code) {
      const [conflictingWarehouse] = await db
        .select()
        .from(warehouses)
        .where(
          and(
            eq(warehouses.parishId, existingWarehouse.parishId),
            eq(warehouses.code, data.code),
            ne(warehouses.id, id)
          )
        )
        .limit(1);

      if (conflictingWarehouse) {
        return NextResponse.json(
          { success: false, error: 'Warehouse code already exists for this parish' },
          { status: 400 }
        );
      }
    }

    // Update warehouse
    const [updatedWarehouse] = await db
      .update(warehouses)
      .set({
        ...data,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(warehouses.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedWarehouse,
    });
  } catch (error) {
    console.error('❌ Error updating warehouse:', error);
    logError(error, { endpoint: '/api/accounting/warehouses/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/accounting/warehouses/:id - Delete warehouse
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

    // Check if warehouse exists
    const [existingWarehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, id))
      .limit(1);

    if (!existingWarehouse) {
      return NextResponse.json(
        { success: false, error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    // Delete warehouse (cascade will handle related stock_movements)
    await db
      .delete(warehouses)
      .where(eq(warehouses.id, id));

    return NextResponse.json({
      success: true,
      message: 'Warehouse deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting warehouse:', error);
    logError(error, { endpoint: '/api/accounting/warehouses/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

