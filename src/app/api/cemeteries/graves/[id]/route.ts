import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { cemeteryGraves, burials, cemeteryConcessions } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { requireAuth, requirePermission } from '@/lib/auth';
import { CEMETERY_PERMISSIONS } from '@/lib/permissions/cemeteries';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { validateUuid } from '@/lib/utils/cemetery';

const updateGraveSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  status: z.enum(['free', 'occupied', 'reserved', 'maintenance']).optional(),
  width: z.number().positive().optional().nullable(),
  length: z.number().positive().optional().nullable(),
  positionX: z.number().int().optional().nullable(),
  positionY: z.number().int().optional().nullable(),
  notes: z.string().optional().nullable(),
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

    const [grave] = await db
      .select()
      .from(cemeteryGraves)
      .where(eq(cemeteryGraves.id, id))
      .limit(1);

    if (!grave) {
      return NextResponse.json(
        { success: false, error: 'Grave not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: grave,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/graves/[id]', method: 'GET' });
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
    await requirePermission(CEMETERY_PERMISSIONS.GRAVES_UPDATE);

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
    const validation = updateGraveSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Get current grave
    const [currentGrave] = await db
      .select()
      .from(cemeteryGraves)
      .where(eq(cemeteryGraves.id, id))
      .limit(1);

    if (!currentGrave) {
      return NextResponse.json(
        { success: false, error: 'Grave not found' },
        { status: 404 }
      );
    }

    // Check for unique code if code is being updated
    if (data.code && data.code !== currentGrave.code) {
      const existingGrave = await db
        .select()
        .from(cemeteryGraves)
        .where(
          and(
            eq(cemeteryGraves.rowId, currentGrave.rowId),
            eq(cemeteryGraves.code, data.code)
          )
        )
        .limit(1);

      if (existingGrave.length > 0 && existingGrave[0].id !== id) {
        return NextResponse.json(
          { success: false, error: 'Grave with this code already exists in this row' },
          { status: 400 }
        );
      }
    }

    // Build update data with proper typing
    const updateData: {
      updatedAt: Date;
      updatedBy?: string;
      code?: string;
      status?: 'free' | 'occupied' | 'reserved' | 'maintenance';
      width?: string | null;
      length?: string | null;
      positionX?: number | null;
      positionY?: number | null;
      notes?: string | null;
    } = {
      updatedAt: new Date(),
      updatedBy: userId,
    };

    if (data.code !== undefined) updateData.code = data.code;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.width !== undefined) updateData.width = data.width?.toString() || null;
    if (data.length !== undefined) updateData.length = data.length?.toString() || null;
    if (data.positionX !== undefined) updateData.positionX = data.positionX;
    if (data.positionY !== undefined) updateData.positionY = data.positionY;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const [updatedGrave] = await db
      .update(cemeteryGraves)
      .set(updateData)
      .where(eq(cemeteryGraves.id, id))
      .returning();

    if (!updatedGrave) {
      return NextResponse.json(
        { success: false, error: 'Grave not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedGrave,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/graves/[id]', method: 'PUT' });
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
    await requirePermission(CEMETERY_PERMISSIONS.GRAVES_DELETE);

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
    const [burialsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(burials)
      .where(eq(burials.graveId, id));

    if (Number(burialsCount?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete grave with existing burials. Please delete all burials first.' },
        { status: 400 }
      );
    }

    const [concessionsCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(cemeteryConcessions)
      .where(eq(cemeteryConcessions.graveId, id));

    if (Number(concessionsCount?.count || 0) > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete grave with existing concessions. Please delete all concessions first.' },
        { status: 400 }
      );
    }

    const [deletedGrave] = await db
      .delete(cemeteryGraves)
      .where(eq(cemeteryGraves.id, id))
      .returning();

    if (!deletedGrave) {
      return NextResponse.json(
        { success: false, error: 'Grave not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedGrave,
    });
  } catch (error) {
    logError(error, { endpoint: '/api/cemeteries/graves/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

