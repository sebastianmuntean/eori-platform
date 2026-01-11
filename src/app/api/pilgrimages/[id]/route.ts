import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimages, parishes, pilgrimageWorkflow, workflowActionEnum } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const updatePilgrimageSchema = z.object({
  parishId: z.string().uuid().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  destination: z.string().max(255).optional().nullable(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  registrationDeadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  maxParticipants: z.number().int().positive().optional().nullable(),
  minParticipants: z.number().int().positive().optional().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'in_progress', 'completed', 'cancelled']).optional(),
  pricePerPerson: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  currency: z.string().length(3).optional(),
  organizerName: z.string().max(255).optional().nullable(),
  organizerContact: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id] - Get pilgrimage by ID
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

    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to view pilgrimages
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

    return NextResponse.json({
      success: true,
      data: pilgrimage,
    });
  } catch (error) {
    console.error('❌ Error fetching pilgrimage:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/pilgrimages/[id] - Update pilgrimage
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // Require authentication
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

    // Check permission to update pilgrimages
    const hasPermission = await checkPermission('pilgrimages.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if pilgrimage exists
    const existingPilgrimage = await getPilgrimageById(id);

    // Check parish access for existing pilgrimage
    try {
      await requireParishAccess(existingPilgrimage.parishId, true);
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

    // For update, we need to merge with existing values for validation
    const mergedData = {
      startDate: (body as any).startDate ?? existingPilgrimage.startDate,
      endDate: (body as any).endDate ?? existingPilgrimage.endDate,
      registrationDeadline: (body as any).registrationDeadline ?? existingPilgrimage.registrationDeadline,
      maxParticipants: (body as any).maxParticipants ?? existingPilgrimage.maxParticipants,
      minParticipants: (body as any).minParticipants ?? existingPilgrimage.minParticipants,
    };

    const validation = updatePilgrimageSchema.safeParse(mergedData);

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

    // Check if parish exists (if being updated) and check access
    if (data.parishId && data.parishId !== existingPilgrimage.parishId) {
      try {
        await requireParishAccess(data.parishId, true);
      } catch (error) {
        if (error instanceof AuthorizationError) {
          return NextResponse.json(
            { success: false, error: error.message },
            { status: 403 }
          );
        }
        throw error;
      }

      const [existingParish] = await db
        .select()
        .from(parishes)
        .where(eq(parishes.id, data.parishId))
        .limit(1);

      if (!existingParish) {
        return NextResponse.json(
          { success: false, error: 'Parish not found' },
          { status: 400 }
        );
      }
    }

    // Update pilgrimage
    const oldStatus = existingPilgrimage.status;
    const updateData: any = {
      ...data,
      updatedAt: new Date(),
      updatedBy: userId,
    };

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updatedPilgrimage] = await db
      .update(pilgrimages)
      .set(updateData)
      .where(eq(pilgrimages.id, id))
      .returning();

    if (!updatedPilgrimage) {
      return NextResponse.json(
        { success: false, error: 'Pilgrimage not found' },
        { status: 404 }
      );
    }

    // Record workflow if status changed
    if (data.status && data.status !== oldStatus) {
      await db.insert(pilgrimageWorkflow).values({
        pilgrimageId: id,
        action: data.status === 'open' ? 'published' : (data.status === 'cancelled' ? 'cancelled' : 'approved') as any,
        fromStatus: oldStatus,
        toStatus: data.status,
        performedBy: userId,
      });
    }

    return NextResponse.json({
      success: true,
      data: updatedPilgrimage,
    });
  } catch (error) {
    console.error('❌ Error updating pilgrimage:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/pilgrimages/[id] - Delete pilgrimage
 */
export async function DELETE(
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

    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to delete pilgrimages
    const hasPermission = await checkPermission('pilgrimages.delete');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify pilgrimage exists before deletion
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

    const [deletedPilgrimage] = await db
      .delete(pilgrimages)
      .where(eq(pilgrimages.id, id))
      .returning();

    if (!deletedPilgrimage) {
      return NextResponse.json(
        { success: false, error: 'Pilgrimage not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedPilgrimage,
    });
  } catch (error) {
    console.error('❌ Error deleting pilgrimage:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

