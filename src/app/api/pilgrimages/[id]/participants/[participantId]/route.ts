import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { pilgrimageParticipants, clients } from '@/database/schema';
import { formatErrorResponse, logError, AuthorizationError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { getPilgrimageById } from '@/lib/services/pilgrimages-service';
import { isValidUUID, formatValidationErrors } from '@/lib/api-utils/validation';
import { requireParishAccess } from '@/lib/api-utils/authorization';

const updateParticipantSchema = z.object({
  parishionerId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().max(100).optional().nullable(),
  cnp: z.string().max(13).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  county: z.string().max(100).optional().nullable(),
  postalCode: z.string().max(20).optional().nullable(),
  emergencyContactName: z.string().max(255).optional().nullable(),
  emergencyContactPhone: z.string().max(50).optional().nullable(),
  specialNeeds: z.string().optional().nullable(),
  status: z.enum(['registered', 'confirmed', 'paid', 'cancelled', 'waitlisted']).optional(),
  totalAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  paidAmount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/pilgrimages/[id]/participants/[participantId] - Get participant by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const { id, participantId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(participantId)) {
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

    const [participant] = await db
      .select()
      .from(pilgrimageParticipants)
      .where(
        and(
          eq(pilgrimageParticipants.id, participantId),
          eq(pilgrimageParticipants.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    console.error('❌ Error fetching participant:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/participants/[participantId]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/pilgrimages/[id]/participants/[participantId] - Update participant
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const { id, participantId } = await params;

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(participantId)) {
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

    const validation = updateParticipantSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if participant exists
    const [existingParticipant] = await db
      .select()
      .from(pilgrimageParticipants)
      .where(
        and(
          eq(pilgrimageParticipants.id, participantId),
          eq(pilgrimageParticipants.pilgrimageId, id)
        )
      )
      .limit(1);

    if (!existingParticipant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    // Check if parishioner exists (if being updated)
    if (data.parishionerId) {
      const [existingParishioner] = await db
        .select()
        .from(clients)
        .where(eq(clients.id, data.parishionerId))
        .limit(1);

      if (!existingParishioner) {
        return NextResponse.json(
          { success: false, error: 'Parishioner not found' },
          { status: 400 }
        );
      }
    }

    const updateData: any = { ...data };
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const [updatedParticipant] = await db
      .update(pilgrimageParticipants)
      .set(updateData)
      .where(eq(pilgrimageParticipants.id, participantId))
      .returning();

    return NextResponse.json({
      success: true,
      data: updatedParticipant,
    });
  } catch (error) {
    console.error('❌ Error updating participant:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/participants/[participantId]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/pilgrimages/[id]/participants/[participantId] - Delete participant
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; participantId: string }> }
) {
  const { id, participantId } = await params;

  try {
    // Validate UUID format
    if (!isValidUUID(id) || !isValidUUID(participantId)) {
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

    const [deletedParticipant] = await db
      .delete(pilgrimageParticipants)
      .where(
        and(
          eq(pilgrimageParticipants.id, participantId),
          eq(pilgrimageParticipants.pilgrimageId, id)
        )
      )
      .returning();

    if (!deletedParticipant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: deletedParticipant,
    });
  } catch (error) {
    console.error('❌ Error deleting participant:', error);
    logError(error, { endpoint: '/api/pilgrimages/[id]/participants/[participantId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

