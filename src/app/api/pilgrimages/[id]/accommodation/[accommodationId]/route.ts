import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageAccommodation } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const updateAccommodationSchema = z.object({
  accommodationName: z.string().max(255).optional().nullable(),
  accommodationType: z.enum(['hotel', 'monastery', 'hostel', 'other']).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  checkInDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  checkOutDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  roomType: z.enum(['single', 'double', 'triple', 'quad', 'dormitory']).optional().nullable(),
  totalRooms: z.number().int().positive().optional().nullable(),
  pricePerNight: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  contactName: z.string().max(255).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/accommodation/[accommodationId] - Get accommodation by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; accommodationId: string }> }
) {
  const { id, accommodationId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(accommodationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, false);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    const [accommodation] = await db
      .select()
      .from(pilgrimageAccommodation)
      .where(
        and(
          eq(pilgrimageAccommodation.id, accommodationId),
          eq(pilgrimageAccommodation.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!accommodation) {
      return NextResponse.json(
        { success: false, error: 'Accommodation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: accommodation,
    });
  } catch (error) {
    console.error('❌ Error fetching accommodation:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/accommodation/[accommodationId]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/pilgrimages/[id]/accommodation/[accommodationId] - Update accommodation
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; accommodationId: string }> }
) {
  const { id, accommodationId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(accommodationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, true);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const validation = updateAccommodationSchema.safeParse(body);

    if (!validation.success) {
      const errorDetails = formatValidationErrors(validation.error.errors);
      return NextResponse.json(
        {
          success: false,
          error: errorDetails.message,
          errors: errorDetails.errors,
          fields: errorDetails.fields,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    const [existingAccommodation] = await db
      .select()
      .from(pilgrimageAccommodation)
      .where(
        and(
          eq(pilgrimageAccommodation.id, accommodationId),
          eq(pilgrimageAccommodation.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!existingAccommodation) {
      return NextResponse.json(
        { success: false, error: 'Accommodation not found' },
        { status: 404 }
      );
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updatedAccommodation] = await db
      .update(pilgrimageAccommodation)
      .set(updateData)
      .where(eq(pilgrimageAccommodation.id, accommodationId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedAccommodation,
    });
  } catch (error) {
    console.error('❌ Error updating accommodation:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/accommodation/[accommodationId]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/pilgrimages/[id]/accommodation/[accommodationId] - Delete accommodation
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; accommodationId: string }> }
) {
  const { id, accommodationId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(accommodationId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const pilgrimage = await getPilgrimageById(id);

    // Check parish access
    try {
      await requireParishAccess(pilgrimage.parishId, true);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 403 }
        );
      }
      throw error;
    }

    const [deletedAccommodation] = await db
      .delete(pilgrimageAccommodation)
      .where(
        and(
          eq(pilgrimageAccommodation.id, accommodationId),
          eq(pilgrimageAccommodation.pilgrimageId, id)
        )
      )
      .returning();

    if (!deletedAccommodation) {
      return NextResponse.json(
        { success: false, error: 'Accommodation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedAccommodation,
    });
  } catch (error) {
    console.error('❌ Error deleting accommodation:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/accommodation/[accommodationId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}


