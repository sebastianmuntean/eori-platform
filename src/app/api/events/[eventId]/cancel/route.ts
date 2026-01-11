import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getEventById } from '@/lib/services/events-service';
import { sendEventStatusChangeNotifications } from '@/lib/services/event-notifications';

const cancelEventSchema = z.object({
  cancellationReason: z.string().optional(),
});

/**
 * POST /api/events/[eventId]/cancel - Cancel an event
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: POST /api/events/${eventId}/cancel - Cancelling event`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validation = cancelEventSchema.safeParse(body);
    const cancellationReason = validation.success ? validation.data.cancellationReason : undefined;

    // Check permission to update events
    const hasPermission = await checkPermission('events.update');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get existing event
    const existingEvent = await getEventById(eventId);

    if (existingEvent.status === 'cancelled') {
      console.log(`⚠️ Event ${eventId} is already cancelled`);
      return NextResponse.json({
        success: true,
        data: existingEvent,
        message: 'Event is already cancelled',
      });
    }

    // Update event status to cancelled
    console.log('Step 2: Updating event status to cancelled');
    const [updatedEvent] = await db
      .update(churchEvents)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
        updatedBy: userId,
        notes: cancellationReason 
          ? (existingEvent.notes ? `${existingEvent.notes}\n\nMotiv anulare: ${cancellationReason}` : `Motiv anulare: ${cancellationReason}`)
          : existingEvent.notes,
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

    console.log(`✓ Event cancelled successfully: ${updatedEvent.id}`);

    // Send cancellation emails to participants
    console.log('Step 3: Sending cancellation emails to participants');
    const emailResult = await sendEventStatusChangeNotifications(
      eventId,
      existingEvent.status,
      'cancelled',
      cancellationReason
    );
    console.log(`✓ Email notifications sent: ${emailResult.sent} successful, ${emailResult.failed} failed`);

    return NextResponse.json({
      success: true,
      data: updatedEvent,
    });
  } catch (error) {
    console.error('❌ Error cancelling event:', error);
    logError(error, { endpoint: '/api/events/[eventId]/cancel', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



