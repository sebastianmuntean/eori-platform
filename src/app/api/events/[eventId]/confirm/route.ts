import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEvents } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { getEventById } from '@/lib/services/events-service';
import { sendEventStatusChangeNotifications } from '@/lib/services/event-notifications';

/**
 * POST /api/events/[eventId]/confirm - Confirm an event
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log(`Step 1: POST /api/events/${eventId}/confirm - Confirming event`);

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

    // Get existing event
    const existingEvent = await getEventById(eventId);

    if (existingEvent.status === 'confirmed') {
      console.log(`⚠️ Event ${eventId} is already confirmed`);
      return NextResponse.json({
        success: true,
        data: existingEvent,
        message: 'Event is already confirmed',
      });
    }

    // Update event status to confirmed
    console.log('Step 2: Updating event status to confirmed');
    const [updatedEvent] = await db
      .update(churchEvents)
      .set({
        status: 'confirmed',
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

    console.log(`✓ Event confirmed successfully: ${updatedEvent.id}`);

    // Send confirmation emails to participants
    console.log('Step 3: Sending confirmation emails to participants');
    const emailResult = await sendEventStatusChangeNotifications(
      eventId,
      existingEvent.status,
      'confirmed'
    );
    console.log(`✓ Email notifications sent: ${emailResult.sent} successful, ${emailResult.failed} failed`);

    return NextResponse.json({
      success: true,
      data: updatedEvent,
    });
  } catch (error) {
    console.error('❌ Error confirming event:', error);
    logError(error, { endpoint: '/api/events/[eventId]/confirm', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



