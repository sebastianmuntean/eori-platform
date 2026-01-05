import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageSchedule } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const updateScheduleSchema = z.object({
  dayNumber: z.number().int().positive().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  activityType: z.enum(['liturgy', 'prayer', 'visit', 'meal', 'transport', 'accommodation', 'other']).optional(),
  durationMinutes: z.number().int().positive().optional().nullable(),
  isOptional: z.boolean().optional(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/schedule/[scheduleId] - Get schedule item by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(scheduleId)) {
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

    const hasPermission = await checkPermission('pilgrimages:view');
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

    const [scheduleItem] = await db
      .select()
      .from(pilgrimageSchedule)
      .where(
        and(
          eq(pilgrimageSchedule.id, scheduleId),
          eq(pilgrimageSchedule.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!scheduleItem) {
      return NextResponse.json(
        { success: false, error: 'Schedule item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: scheduleItem,
    });
  } catch (error) {
    console.error('❌ Error fetching schedule item:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/schedule/[scheduleId]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/pilgrimages/[id]/schedule/[scheduleId] - Update schedule item
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(scheduleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages:update');
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

    const validation = updateScheduleSchema.safeParse(body);

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

    const [existingItem] = await db
      .select()
      .from(pilgrimageSchedule)
      .where(
        and(
          eq(pilgrimageSchedule.id, scheduleId),
          eq(pilgrimageSchedule.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Schedule item not found' },
        { status: 404 }
      );
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updatedItem] = await db
      .update(pilgrimageSchedule)
      .set(updateData)
      .where(eq(pilgrimageSchedule.id, scheduleId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedItem,
    });
  } catch (error) {
    console.error('❌ Error updating schedule item:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/schedule/[scheduleId]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/pilgrimages/[id]/schedule/[scheduleId] - Delete schedule item
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; scheduleId: string }> }
) {
  const { id, scheduleId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(scheduleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const hasPermission = await checkPermission('pilgrimages:update');
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

    const [deletedItem] = await db
      .delete(pilgrimageSchedule)
      .where(
        and(
          eq(pilgrimageSchedule.id, scheduleId),
          eq(pilgrimageSchedule.pilgrimageId, id)
        )
      )
      .returning();

    if (!deletedItem) {
      return NextResponse.json(
        { success: false, error: 'Schedule item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedItem,
    });
  } catch (error) {
    console.error('❌ Error deleting schedule item:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/schedule/[scheduleId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

