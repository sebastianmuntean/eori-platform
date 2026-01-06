import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { fixedAssets } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';
import { eq, and, ne } from 'drizzle-orm';
import { z } from 'zod';

const updateFixedAssetSchema = z.object({
  inventoryNumber: z.string().min(1, 'Inventory number is required').max(50).optional(),
  name: z.string().min(1, 'Name is required').max(255).optional(),
  description: z.string().optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  type: z.string().max(100).optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  acquisitionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable().or(z.literal('').transform(() => null)),
  acquisitionValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid monetary value').optional().nullable().or(z.literal('').transform(() => null)),
  currentValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid monetary value').optional().nullable().or(z.literal('').transform(() => null)),
  depreciationMethod: z.string().max(20).optional().nullable(),
  usefulLifeYears: z.number().int().positive().optional().nullable(),
  status: z.enum(['active', 'inactive', 'disposed', 'damaged']).optional(),
  disposalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable().or(z.literal('').transform(() => null)),
  disposalValue: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Invalid monetary value').optional().nullable().or(z.literal('').transform(() => null)),
  disposalReason: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/accounting/fixed-assets/:id - Get fixed asset by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const [asset] = await db
      .select()
      .from(fixedAssets)
      .where(eq(fixedAssets.id, id))
      .limit(1);

    if (!asset) {
      return NextResponse.json(
        { success: false, error: 'Fixed asset not found' },
        { status: 404 }
      );
    }

    // Check parish access - users can only access assets from their own parish unless they have admin role
    const isAdmin = await hasRole(userId, 'superadmin') || await hasRole(userId, 'episcop');
    if (!isAdmin && user.parishId !== asset.parishId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this asset' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: asset,
    });
  } catch (error) {
    console.error('❌ Error fetching fixed asset:', error);
    logError(error, { endpoint: '/api/accounting/fixed-assets/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/accounting/fixed-assets/:id - Update fixed asset
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const validation = updateFixedAssetSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if asset exists
    const [existingAsset] = await db
      .select()
      .from(fixedAssets)
      .where(eq(fixedAssets.id, id))
      .limit(1);

    if (!existingAsset) {
      return NextResponse.json(
        { success: false, error: 'Fixed asset not found' },
        { status: 404 }
      );
    }

    // Check parish access - users can only update assets from their own parish unless they have admin role
    const isAdmin = await hasRole(userId, 'superadmin') || await hasRole(userId, 'episcop');
    if (!isAdmin && user.parishId !== existingAsset.parishId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this asset' },
        { status: 403 }
      );
    }

    // If inventory number is being updated, check if it conflicts with another asset
    if (data.inventoryNumber && data.inventoryNumber !== existingAsset.inventoryNumber) {
      const [conflictingAsset] = await db
        .select()
        .from(fixedAssets)
        .where(
          and(
            eq(fixedAssets.parishId, existingAsset.parishId),
            eq(fixedAssets.inventoryNumber, data.inventoryNumber),
            ne(fixedAssets.id, id)
          )
        )
        .limit(1);

      if (conflictingAsset) {
        return NextResponse.json(
          { success: false, error: 'Inventory number already exists for this parish' },
          { status: 400 }
        );
      }
    }

    // Update fixed asset
    const updateData: any = { ...data };
    if (data.acquisitionDate !== undefined) {
      updateData.acquisitionDate = data.acquisitionDate && data.acquisitionDate !== '' ? data.acquisitionDate : null;
    }
    if (data.disposalDate !== undefined) {
      updateData.disposalDate = data.disposalDate && data.disposalDate !== '' ? data.disposalDate : null;
    }
    if (data.acquisitionValue !== undefined) {
      updateData.acquisitionValue = data.acquisitionValue && data.acquisitionValue !== '' ? data.acquisitionValue : null;
    }
    if (data.currentValue !== undefined) {
      updateData.currentValue = data.currentValue && data.currentValue !== '' ? data.currentValue : null;
    }
    if (data.disposalValue !== undefined) {
      updateData.disposalValue = data.disposalValue && data.disposalValue !== '' ? data.disposalValue : null;
    }

    const [updatedAsset] = await db
      .update(fixedAssets)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(fixedAssets.id, id))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedAsset,
    });
  } catch (error) {
    console.error('❌ Error updating fixed asset:', error);
    logError(error, { endpoint: '/api/accounting/fixed-assets/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/accounting/fixed-assets/:id - Delete fixed asset
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, user } = await getCurrentUser();
    if (!userId || !user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if asset exists
    const [existingAsset] = await db
      .select()
      .from(fixedAssets)
      .where(eq(fixedAssets.id, id))
      .limit(1);

    if (!existingAsset) {
      return NextResponse.json(
        { success: false, error: 'Fixed asset not found' },
        { status: 404 }
      );
    }

    // Check parish access - users can only delete assets from their own parish unless they have admin role
    const isAdmin = await hasRole(userId, 'superadmin') || await hasRole(userId, 'episcop');
    if (!isAdmin && user.parishId !== existingAsset.parishId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this asset' },
        { status: 403 }
      );
    }

    // Delete fixed asset
    await db
      .delete(fixedAssets)
      .where(eq(fixedAssets.id, id));

    return NextResponse.json({
      success: true,
      message: 'Fixed asset deleted successfully',
    });
  } catch (error) {
    console.error('❌ Error deleting fixed asset:', error);
    logError(error, { endpoint: '/api/accounting/fixed-assets/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

