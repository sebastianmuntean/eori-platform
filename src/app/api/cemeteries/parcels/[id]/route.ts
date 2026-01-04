import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryParcels, cemeteryRows, cemeteryGraves } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { validateUuid } from '@/lib/utils/cemetery';

const updateParcelSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().max(255).optional().nullable(),
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

    const [parcel] = await db
      .select()
      .from(cemeteryParcels)
      .where(eq(cemeteryParcels.id, id))
      .limit(1);

    if (!parcel) {
      return NextResponse.json(
        { success: false, error: 'Parcel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: parcel,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/parcels/[id]', method: 'GET' });
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
    await requirePermission(CEMETERY_PERMISSIONS.PARCELS_UPDATE);

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
    const validation = updateParcelSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get current parcel
    const [currentParcel] = await db
      .select()
      .from(cemeteryParcels)
      .where(eq(cemeteryParcels.id, id))
      .limit(1);

    if (!currentParcel) {
      return NextResponse.json(
        { success: false, error: 'Parcel not found' },
        { status: 404 }
      );
    }

    // Check for unique code if code is being updated
    if (data.code && data.code !== currentParcel.code) {
      const existingParcel = await db
        .select()
        .from(cemeteryParcels)
        .where(
          and(
            eq(cemeteryParcels.cemeteryId, currentParcel.cemeteryId),
            eq(cemeteryParcels.code, data.code)
          )
        )
        .limit(1);

      if (existingParcel.length > 0 && existingParcel[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'Parcel with this code already exists in this cemetery' },
          { status: 400 }
        );
      }
    }

    // Build update data with proper typing
    const updateData: {
      updatedAt: Date;
      updatedBy?: string;
      code?: string;
      name?: string | null;
    } = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;

    const [updatedParcel] = await db
      .update(cemeteryParcels)
      .set(updateData)
      .where(eq(cemeteryParcels.id, id))
      .returning();

    if (!updatedParcel) {
      return NextResponse.json(
        { success: false, error: 'Parcel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedParcel,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/parcels/[id]', method: 'PUT' });
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
    await requirePermission(CEMETERY_PERMISSIONS.PARCELS_DELETE);

    const { id } = await params;
    
    // Validate UUID
    const uuidValidation = validateUuid(id);
    if (!uuidValidation.valid) {
      return NextResponse.json(
        { success: false, error: uuidValidation.error },
        { status: 400 }
      );
    }

    // Check for related records before deletion
    const [rowsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryRows)
      .where(eq(cemeteryRows.parcelId, id));

    if (Number(rowsCount?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete parcel with existing rows. Please delete all rows first.' },
        { status: 400 }
      );
    }

    const [gravesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryGraves)
      .where(eq(cemeteryGraves.parcelId, id));

    if (Number(gravesCount?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete parcel with existing graves. Please delete all graves first.' },
        { status: 400 }
      );
    }

    const [deletedParcel] = await db
      .delete(cemeteryParcels)
      .where(eq(cemeteryParcels.id, id))
      .returning();

    if (!deletedParcel) {
      return NextResponse.json(
        { success: false, error: 'Parcel not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedParcel,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/parcels/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

