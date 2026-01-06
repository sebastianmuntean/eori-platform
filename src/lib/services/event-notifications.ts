import { db } from '@/database/client';
import { churchEvents, parishes, churchEventParticipants } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { sendEventConfirmationEmail, sendEventCancellationEmail } from '@/lib/email';

const typeLabels: Record<'wedding' | 'baptism' | 'funeral', string> = {
  wedding: 'Nuntă',
  baptism: 'Botez',
  funeral: 'Înmormântare',
};

function formatDate(dateString: string | null) {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Send event status change notifications to participants
 */
export async function sendEventStatusChangeNotifications(
  eventId: string,
  oldStatus: string,
  newStatus: string,
  cancellationReason?: string
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  // Only send emails if status changed to confirmed or cancelled
  if (newStatus !== 'confirmed' && newStatus !== 'cancelled') {
    return { sent, failed };
  }

  if (newStatus === oldStatus) {
    return { sent, failed };
  }

  // Get event and parish information
  const [event] = await db
    .select()
    .from(churchEvents)
    .where(eq(churchEvents.id, eventId))
    .limit(1);

  if (!event) {
    return { sent, failed };
  }

  const [parish] = await db
    .select()
    .from(parishes)
    .where(eq(parishes.id, event.parishId))
    .limit(1);

  // Get participants with email addresses
  const participants = await db
    .select()
    .from(churchEventParticipants)
    .where(eq(churchEventParticipants.eventId, eventId));

  // Send emails based on status change
  if (newStatus === 'confirmed' && oldStatus !== 'confirmed') {
    for (const participant of participants) {
      if (participant.email) {
        try {
          await sendEventConfirmationEmail(
            participant.email,
            `${participant.firstName} ${participant.lastName || ''}`.trim(),
            {
              type: event.type,
              date: event.eventDate,
              location: event.location,
              priestName: event.priestName,
              parishName: parish?.name || 'Parohie necunoscută',
              notes: event.notes,
            }
          );
          sent++;
        } catch (error) {
          console.error(`Failed to send confirmation email to ${participant.email}:`, error);
          failed++;
        }
      }
    }
  } else if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
    for (const participant of participants) {
      if (participant.email) {
        try {
          await sendEventCancellationEmail(
            participant.email,
            `${participant.firstName} ${participant.lastName || ''}`.trim(),
            {
              type: event.type,
              date: event.eventDate,
              location: event.location,
              parishName: parish?.name || 'Parohie necunoscută',
            },
            cancellationReason || event.notes || undefined
          );
          sent++;
        } catch (error) {
          console.error(`Failed to send cancellation email to ${participant.email}:`, error);
          failed++;
        }
      }
    }
  }

  return { sent, failed };
}







