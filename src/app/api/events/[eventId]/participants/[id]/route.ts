import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEventParticipants, churchEvents, parishioners } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getEventById } from '@/lib/services/events-service';

// Consistent role enum for both create and update
const participantRoleEnum = z.enum(['bride', 'groom', 'baptized', 'deceased', 'godparent', 'witness', 'parent', 'family_member', 'other']);

const updateParticipantSchema = z.object({
  parishionerId: z.string().uuid().optional().nullable(),
  role: participantRoleEnum.optional(),
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().max(255).optional().nullable(),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  cnp: z.string().max(13).optional().nullable(),
  address: z.string().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/events/[eventId]/participants/[id] - Get participant by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  const { eventId, id } = await params;
  console.log(`Step 1: GET /api/events/${eventId}/participants/${id} - Fetching participant`);

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to view events
    const hasPermission = await checkPermission('events:view');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if event exists
    await getEventById(eventId);

    const [participant] = await db
      .select()
      .from(churchEventParticipants)
      .where(eq(churchEventParticipants.id, id))
      .limit(1);

    if (!participant || participant.eventId !== eventId) {
      console.log(`❌ Participant ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Participant found: ${participant.firstName}`);
    return NextResponse.json({
      success: true,
      data: participant,
    });
  } catch (error) {
    console.error('❌ Error fetching participant:', error);
    logError(error, { endpoint: '/api/events/[eventId]/participants/[id]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/events/[eventId]/participants/[id] - Update participant
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  const { eventId, id } = await params;
  console.log(`Step 1: PUT /api/events/${eventId}/participants/${id} - Updating participant`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to update events
    const hasPermission = await checkPermission('events:update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if event exists
    await getEventById(eventId);

    // Check if participant exists
    const [existingParticipant] = await db
      .select()
      .from(churchEventParticipants)
      .where(eq(churchEventParticipants.id, id))
      .limit(1);

    if (!existingParticipant || existingParticipant.eventId !== eventId) {
      console.log(`❌ Participant ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validation = updateParticipantSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if parishioner exists (if being updated)
    if (data.parishionerId) {
      console.log(`Step 2: Checking if parishioner ${data.parishionerId} exists`);
      const [existingParishioner] = await db
        .select()
        .from(parishioners)
        .where(eq(parishioners.id, data.parishionerId))
        .limit(1);

      if (!existingParishioner) {
        console.log(`❌ Parishioner ${data.parishionerId} not found`);
        return NextResponse.json(
          { success: false, error: 'Parishioner not found' },
          { status: 400 }
        );
      }
    }

    // Update participant
    console.log('Step 3: Updating participant');
    const updateData: any = { ...data };
    // Convert family_member to other for database storage
    if (updateData.role === 'family_member') {
      updateData.role = 'other';
    }
    const [updatedParticipant] = await db
      .update(churchEventParticipants)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(churchEventParticipants.id, id))
      .returning();

    if (!updatedParticipant) {
      console.log(`❌ Participant ${id} not found after update`);
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Participant updated successfully: ${updatedParticipant.id}`);
    return NextResponse.json({
      success: true,
      data: updatedParticipant,
    });
  } catch (error) {
    console.error('❌ Error updating participant:', error);
    logError(error, { endpoint: '/api/events/[eventId]/participants/[id]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/events/[eventId]/participants/[id] - Delete participant
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string; id: string }> }
) {
  const { eventId, id } = await params;
  console.log(`Step 1: DELETE /api/events/${eventId}/participants/${id} - Deleting participant`);

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to update events
    const hasPermission = await checkPermission('events:update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Check if event exists
    await getEventById(eventId);

    const [deletedParticipant] = await db
      .delete(churchEventParticipants)
      .where(eq(churchEventParticipants.id, id))
      .returning();

    if (!deletedParticipant || deletedParticipant.eventId !== eventId) {
      console.log(`❌ Participant ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Participant deleted successfully: ${deletedParticipant.id}`);
    return NextResponse.json({
      success: true,
      data: deletedParticipant,
    });
  } catch (error) {
    console.error('❌ Error deleting participant:', error);
    logError(error, { endpoint: '/api/events/[eventId]/participants/[id]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



