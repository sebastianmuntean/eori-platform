import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents, parishes } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getEventById } from '@/lib/services/events-service';
import { sendEventStatusChangeNotifications } from '@/lib/services/event-notifications';

const updateEventSchema = z.object({
  parishId: z.string().uuid().optional(),
  type: z.enum(['wedding', 'baptism', 'funeral']).optional(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  eventDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional().nullable(),
  location: z.string().max(255).optional().nullable(),
  priestName: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * GET /api/events/[eventId] - Get event by ID
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: GET /api/events/${eventId} - Fetching event`);

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

    const event = await getEventById(eventId);

    console.log(`✓ Event found: ${event.type}`);
    return NextResponse.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('❌ Error fetching event:', error);
    logError(error, { endpoint: '/api/events/[eventId]', method: 'GET' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * PUT /api/events/[eventId] - Update event
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: PUT /api/events/${eventId} - Updating event`);

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

    const body = await request.json();
    const validation = updateEventSchema.safeParse(body);

    if (!validation.success) {
      console.log('❌ Validation failed:', validation.error.errors);
      return NextResponse.json(
        { success: false, error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if event exists
    const existingEvent = await getEventById(eventId);

    // Check if parish exists (if being updated)
    if (data.parishId) {
      console.log(`Step 2: Checking if parish ${data.parishId} exists`);
      const [existingParish] = await db
        .select()
        .from(parishes)
        .where(eq(parishes.id, data.parishId))
        .limit(1);

      if (!existingParish) {
        console.log(`❌ Parish ${data.parishId} not found`);
        return NextResponse.json(
          { success: false, error: 'Parish not found' },
          { status: 400 }
        );
      }
    }

    // Update event
    console.log('Step 3: Updating event');
    const oldStatus = existingEvent.status;
    const [updatedEvent] = await db
      .update(churchEvents)
      .set({
        ...data,
        updatedAt: new Date(),
        updatedBy: userId,
      })
      .where(eq(churchEvents.id, eventId))
      .returning();

    if (!updatedEvent) {
      console.log(`❌ Event ${eventId} not found after update`);
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Event updated successfully: ${updatedEvent.id}`);

    // Send email notifications if status changed
    if (data.status && data.status !== oldStatus) {
      console.log(`Step 4: Status changed from ${oldStatus} to ${data.status}, sending notifications`);
      const emailResult = await sendEventStatusChangeNotifications(
        eventId,
        oldStatus,
        data.status
      );
      console.log(`✓ Email notifications sent: ${emailResult.sent} successful, ${emailResult.failed} failed`);
    }

    return NextResponse.json({
      success: true,
      data: updatedEvent,
    });
  } catch (error) {
    console.error('❌ Error updating event:', error);
    logError(error, { endpoint: '/api/events/[eventId]', method: 'PUT' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

/**
 * DELETE /api/events/[eventId] - Delete event
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: DELETE /api/events/${eventId} - Deleting event`);

  try {
    // Require authentication
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to delete events
    const hasPermission = await checkPermission('events:delete');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Verify event exists before deletion
    await getEventById(eventId);

    const [deletedEvent] = await db
      .delete(churchEvents)
      .where(eq(churchEvents.id, eventId))
      .returning();

    if (!deletedEvent) {
      console.log(`❌ Event ${eventId} not found`);
      return NextResponse.json(
        { success: false, error: 'Event not found' },
        { status: 404 }
      );
    }

    console.log(`✓ Event deleted successfully: ${deletedEvent.id}`);
    return NextResponse.json({
      success: true,
      data: deletedEvent,
    });
  } catch (error) {
    console.error('❌ Error deleting event:', error);
    logError(error, { endpoint: '/api/events/[eventId]', method: 'DELETE' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}

