import { NextResponse } from 'next/server';
import { db } from '@/database/client';
import { churchEventEmailSubmissions, churchEvents, churchEventParticipants } from '@/database/schema';
import { formatErrorResponse, logError } from '@/lib/errors';
import { getCurrentUser, checkPermission } from '@/lib/auth';
import { eq } from 'drizzle-orm';
import { parseEventEmail } from '@/lib/services/email-parser';

/**
 * POST /api/events/email-submissions/[id]/process - Manually process an email submission
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  console.log(`Step 1: POST /api/events/email-submissions/${id}/process - Processing email submission`);

  try {
    const { userId } = await getCurrentUser();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check permission to create events
    const hasPermission = await checkPermission('events:create');
    if (!hasPermission) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get email submission
    const [emailSubmission] = await db
      .select()
      .from(churchEventEmailSubmissions)
      .where(eq(churchEventEmailSubmissions.id, id))
      .limit(1);

    if (!emailSubmission) {
      console.log(`❌ Email submission ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Email submission not found' },
        { status: 404 }
      );
    }

    if (emailSubmission.status === 'processed') {
      console.log(`⚠️ Email submission ${id} is already processed`);
      return NextResponse.json({
        success: true,
        data: emailSubmission,
        message: 'Email submission is already processed',
      });
    }

    // Parse email content
    console.log('Step 2: Parsing email content');
    const parsedEvent = parseEventEmail(
      emailSubmission.subject || '',
      emailSubmission.content,
      emailSubmission.content // Use content as HTML if available
    );

    if (!parsedEvent.type) {
      console.log(`❌ Could not determine event type from email`);
      
      // Update submission with error
      const [updatedSubmission] = await db
        .update(churchEventEmailSubmissions)
        .set({
          status: 'error',
          errorMessage: 'Could not determine event type from email content',
          updatedAt: new Date(),
        })
        .where(eq(churchEventEmailSubmissions.id, id))
        .returning();

      return NextResponse.json(
        { 
          success: false, 
          error: 'Could not determine event type from email content',
          data: updatedSubmission,
        },
        { status: 400 }
      );
    }

    // Get default parish ID from env (required for creating event)
    const defaultParishId = process.env.DEFAULT_PARISH_ID;
    if (!defaultParishId) {
      console.log(`❌ DEFAULT_PARISH_ID not configured`);
      return NextResponse.json(
        { success: false, error: 'DEFAULT_PARISH_ID not configured' },
        { status: 500 }
      );
    }

    // Create event and participants in a transaction
    console.log('Step 3: Creating event from email submission');
    let newEvent;
    let updatedSubmission;

    await db.transaction(async (tx) => {
      // Create event
      const [createdEvent] = await tx
        .insert(churchEvents)
        .values({
          parishId: defaultParishId,
          type: parsedEvent.type,
          status: 'pending',
          eventDate: parsedEvent.eventDate || null,
          location: parsedEvent.location || null,
          priestName: parsedEvent.priestName || null,
          notes: parsedEvent.notes || null,
          createdBy: userId,
        })
        .returning();

      newEvent = createdEvent;

      // Create participants if any
      if (parsedEvent.participants && parsedEvent.participants.length > 0) {
        console.log(`Step 4: Creating ${parsedEvent.participants.length} participants`);
        const participantsData = parsedEvent.participants.map((p) => ({
          eventId: newEvent.id,
          role: (p.role === 'family_member' ? 'other' : p.role) as 'bride' | 'groom' | 'baptized' | 'deceased' | 'godparent' | 'witness' | 'parent' | 'other',
          firstName: p.firstName,
          lastName: p.lastName || null,
          birthDate: p.birthDate || null,
          phone: p.phone || null,
          email: p.email || null,
        }));

        await tx.insert(churchEventParticipants).values(participantsData);
      }

      // Update email submission
      console.log('Step 5: Updating email submission status');
      const [submission] = await tx
        .update(churchEventEmailSubmissions)
        .set({
          eventId: newEvent.id,
          status: 'processed',
          processedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(churchEventEmailSubmissions.id, id))
        .returning();

      updatedSubmission = submission;
    });

    console.log(`✓ Email submission processed successfully, event created: ${newEvent.id}`);

    return NextResponse.json({
      success: true,
      data: {
        emailSubmission: updatedSubmission,
        event: newEvent,
      },
    });
  } catch (error) {
    console.error('❌ Error processing email submission:', error);

    // Update submission with error
    try {
      await db
        .update(churchEventEmailSubmissions)
        .set({
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          updatedAt: new Date(),
        })
        .where(eq(churchEventEmailSubmissions.id, id));
    } catch (updateError) {
      console.error('Failed to update email submission error status:', updateError);
    }

    logError(error, { endpoint: '/api/events/email-submissions/[id]/process', method: 'POST' });
    return NextResponse.json(formatErrorResponse(error), {
      status: formatErrorResponse(error).statusCode,
    });
  }
}



