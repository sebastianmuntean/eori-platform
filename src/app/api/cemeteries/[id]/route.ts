import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteries, cemeteryParcels, cemeteryRows, cemeteryGraves } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { validateUuid } from '@/lib/utils/cemetery';

const updateCemeterySchema = z.object({
  code: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(255).optional(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  totalArea: z.number().positive().optional().nullable(),
  totalPlots: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
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

    const [cemetery] = await db
      .select()
      .from(cemeteries)
      .where(eq(cemeteries.id, id))
      .limit(1);

    if (!cemetery) {
      return NextResponse.json(
        { success: false, error: 'Cemetery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: cemetery,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/[id]', method: 'GET' });
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
    await requirePermission(CEMETERY_PERMISSIONS.CEMETERIES_UPDATE);

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
    const validation = updateCemeterySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get current cemetery
    const [currentCemetery] = await db
      .select()
      .from(cemeteries)
      .where(eq(cemeteries.id, id))
      .limit(1);

    if (!currentCemetery) {
      return NextResponse.json(
        { success: false, error: 'Cemetery not found' },
        { status: 404 }
      );
    }

    // Check for unique code if code is being updated
    if (data.code && data.code !== currentCemetery.code) {
      const existingCemetery = await db
        .select()
        .from(cemeteries)
        .where(
          and(
            eq(cemeteries.parishId, currentCemetery.parishId),
            eq(cemeteries.code, data.code)
          )
        )
        .limit(1);

      if (existingCemetery.length > 0 && existingCemetery[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'Cemetery with this code already exists in this parish' },
          { status: 400 }
        );
      }
    }

    // Build update data with proper typing
    const updateData: {
      updatedAt: Date;
      updatedBy?: string;
      code?: string;
      name?: string;
      address?: string | null;
      city?: string | null;
      county?: string | null;
      totalArea?: string | null;
      totalPlots?: number | null;
      notes?: string | null;
      isActive?: boolean;
    } = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    if (data.code !== undefined) updateData.code = data.code;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.city !== undefined) updateData.city = data.city;
    if (data.county !== undefined) updateData.county = data.county;
    if (data.totalArea !== undefined) updateData.totalArea = data.totalArea?.toString() || null;
    if (data.totalPlots !== undefined) updateData.totalPlots = data.totalPlots;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const [updatedCemetery] = await db
      .update(cemeteries)
      .set(updateData)
      .where(eq(cemeteries.id, id))
      .returning();

    if (!updatedCemetery) {
      return NextResponse.json(
        { success: false, error: 'Cemetery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedCemetery,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/[id]', method: 'PUT' });
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
    await requirePermission(CEMETERY_PERMISSIONS.CEMETERIES_DELETE);

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
    const [parcelsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryParcels)
      .where(eq(cemeteryParcels.cemeteryId, id));

    if (Number(parcelsCount?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete cemetery with existing parcels. Please delete all parcels first.' },
        { status: 400 }
      );
    }

    const [rowsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryRows)
      .where(eq(cemeteryRows.cemeteryId, id));

    if (Number(rowsCount?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete cemetery with existing rows. Please delete all rows first.' },
        { status: 400 }
      );
    }

    const [gravesCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryGraves)
      .where(eq(cemeteryGraves.cemeteryId, id));

    if (Number(gravesCount?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete cemetery with existing graves. Please delete all graves first.' },
        { status: 400 }
      );
    }

    const [deletedCemetery] = await db
      .delete(cemeteries)
      .where(eq(cemeteries.id, id))
      .returning();

    if (!deletedCemetery) {
      return NextResponse.json(
        { success: false, error: 'Cemetery not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedCemetery,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

