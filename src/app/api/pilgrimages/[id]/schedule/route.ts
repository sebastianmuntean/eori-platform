import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageSchedule } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, asc } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const createScheduleSchema = z.object({
  dayNumber: z.number().int().positive().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
  title: z.string().min(1).max(255),
  description: z.string().optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  activityType: z.enum(['liturgy', 'prayer', 'visit', 'meal', 'transport', 'accommodation', 'other']),
  durationMinutes: z.number().int().positive().optional().nullable(),
  isOptional: z.boolean().optional().default(false),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/schedule - Get schedule for a pilgrimage
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
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

    const schedule = await db
      .select()
      .from(pilgrimageSchedule)
      .where(eq(pilgrimageSchedule.pilgrimageId, id))
      .orderBy(asc(pilgrimageSchedule.dayNumber), asc(pilgrimageSchedule.date), asc(pilgrimageSchedule.time));

    return NextResponse.json({
      success: true,
      data: schedule,
    });
  } catch (error) {
    console.error('❌ Error fetching schedule:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/schedule', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * POST /api/pilgrimages/[id]/schedule - Create a new schedule item
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid pilgrimage ID format' },
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

    const validation = createScheduleSchema.safeParse(body);

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

    const [newScheduleItem] = await db
      .insert(pilgrimageSchedule)
      .values({
        pilgrimageId: id,
        dayNumber: data.dayNumber || null,
        date: data.date || null,
        time: data.time || null,
        title: data.title,
        description: data.description || null,
        location: data.location || null,
        activityType: data.activityType,
        durationMinutes: data.durationMinutes || null,
        isOptional: data.isOptional || false,
        notes: data.notes || null,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newScheduleItem,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error creating schedule item:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/schedule', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

