/**
 * Email Fetcher Service
 * Fetches emails from IMAP server and processes event requests
 * 
 * NOTE: This requires the following npm packages:
 * - imap-simple (or imap)
 * - mailparser
 * 
 * Install with: npm install imap-simple mailparser
 */

import { db } from '@/database/client';
import { churchEvents, churchEventEmailSubmissions, churchEventParticipants } from '@/database/schema';
import { parseEventEmail, isEventEmail, ParsedEventData } from './email-parser';
import { sendEmailWithTemplate } from '@/lib/email';
import { eq } from 'drizzle-orm';

// Note: Type definitions for imap-simple and mailparser need to be installed
// npm install --save-dev @types/imap-simple @types/mailparser

interface ImapConfig {
  imap: {
    user: string;
    password: string;
    host: string;
    port: number;
    tls: boolean;
    authTimeout: number;
  };
}

/**
 * Fetch and process emails from IMAP inbox
 */
export async function fetchAndProcessEmails(): Promise<{
  processed: number;
  created: number;
  errors: number;
}> {
  console.log('Step 1: Starting email fetch process');

  const stats = {
    processed: 0,
    created: 0,
    errors: 0,
  };

  // Check if IMAP is configured
  const imapHost = process.env.IMAP_HOST;
  const imapUser = process.env.IMAP_USER;
  const imapPassword = process.env.IMAP_PASSWORD;
  const imapPort = parseInt(process.env.IMAP_PORT || '993');

  if (!imapHost || !imapUser || !imapPassword) {
    console.warn('⚠️ IMAP not configured - skipping email fetch');
    return stats;
  }

  try {
    // Dynamic import to avoid errors if package is not installed
    const imap = await import('imap-simple');
    const simpleParser = await import('mailparser');

    console.log(`Step 2: Connecting to IMAP server ${imapHost}:${imapPort}`);

    const config: ImapConfig = {
      imap: {
        user: imapUser,
        password: imapPassword,
        host: imapHost,
        port: imapPort,
        tls: imapPort === 993,
        authTimeout: 3000,
      },
    };

    const connection = await imap.default.connect(config);
    console.log('✓ Connected to IMAP server');

    try {
      await connection.openBox('INBOX');
      console.log('✓ Opened INBOX');

      // Fetch unread emails from last 24 hours
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const searchCriteria = ['UNSEEN', ['SINCE', yesterday]];

      const fetchOptions = {
        bodies: '',
        struct: true,
      };

      const messages = await connection.search(searchCriteria, fetchOptions);
      console.log(`✓ Found ${messages.length} unread emails`);

      for (const message of messages) {
        stats.processed++;

        try {
          const all = imap.default.getParts(message.attributes.struct || []);
          const part = all.find((part: any) => part.which === 'TEXT' || part.which === '');
          
          if (!part) {
            console.log(`⚠️ No text part found in email ${message.attributes.uid}`);
            continue;
          }

          const partData = await connection.getPartData(message, part);
          const parsed = await simpleParser.default.simpleParser(partData);

          const subject = parsed.subject || '';
          const textContent = parsed.text || '';
          const htmlContent = parsed.html || '';

          console.log(`Processing email: ${subject}`);

          // Check if this is an event email
          if (!isEventEmail(subject, textContent)) {
            console.log(`  Not an event email, skipping`);
            continue;
          }

          // Parse event data
          const parsedEvent = parseEventEmail(subject, textContent, htmlContent);

          if (!parsedEvent.type) {
            console.log(`  Could not determine event type, skipping`);
            continue;
          }

          // Get default parish ID from env (or use first parish as fallback)
          // In production, you might want to determine parish from email domain or other criteria
          const defaultParishId = process.env.DEFAULT_PARISH_ID;
          if (!defaultParishId) {
            console.log(`  ⚠️ DEFAULT_PARISH_ID not configured, skipping`);
            stats.errors++;
            continue;
          }

          // Create email submission record
          const [emailSubmission] = await db
            .insert(churchEventEmailSubmissions)
            .values({
              fromEmail: parsed.from?.value?.[0]?.address || 'unknown@example.com',
              subject: subject.substring(0, 500),
              content: textContent.substring(0, 10000), // Limit content size
              status: 'pending',
            })
            .returning();

          console.log(`  Created email submission: ${emailSubmission.id}`);

          // Create event
          const [newEvent] = await db
            .insert(churchEvents)
            .values({
              parishId: defaultParishId,
              type: parsedEvent.type,
              status: 'pending',
              eventDate: parsedEvent.eventDate,
              location: parsedEvent.location,
              priestName: parsedEvent.priestName,
              notes: parsedEvent.notes,
            })
            .returning();

          console.log(`  Created event: ${newEvent.id} (${newEvent.type})`);

          // Create participants
          if (parsedEvent.participants && parsedEvent.participants.length > 0) {
            const participantValues = parsedEvent.participants.map(p => ({
              eventId: newEvent.id,
              role: p.role as any,
              firstName: p.firstName,
              lastName: p.lastName || null,
              phone: p.phone || null,
              email: p.email || null,
              birthDate: p.birthDate || null,
            }));

            await db.insert(churchEventParticipants).values(participantValues);
            console.log(`  Created ${participantValues.length} participants`);
          }

          // Update email submission
          await db
            .update(churchEventEmailSubmissions)
            .set({
              eventId: newEvent.id,
              status: 'processed',
              processedAt: new Date(),
            })
            .where(eq(churchEventEmailSubmissions.id, emailSubmission.id));

          stats.created++;

          // Send confirmation email (optional)
          const senderEmail = parsed.from?.value?.[0]?.address;
          if (senderEmail && process.env.SEND_EVENT_CONFIRMATION_EMAIL === 'true') {
            try {
              // You would need to create an email template for this
              // await sendEmailWithTemplate('event-received', senderEmail, 'Name', { eventId: newEvent.id });
              console.log(`  Would send confirmation email to ${senderEmail}`);
            } catch (emailError) {
              console.error(`  Failed to send confirmation email: ${emailError}`);
            }
          }

        } catch (error) {
          console.error(`❌ Error processing email ${message.attributes.uid}:`, error);
          stats.errors++;

          // Mark email submission as error (if it was created)
          // This would require tracking which submission corresponds to which email
        }
      }

      // Mark emails as read (optional - comment out if you want to keep them unread)
      // const uids = messages.map(m => m.attributes.uid);
      // await connection.addFlags(uids, '\\Seen');

    } finally {
      await connection.end();
      console.log('✓ Disconnected from IMAP server');
    }

  } catch (error) {
    console.error('❌ Error fetching emails:', error);
    if (error instanceof Error && error.message.includes('Cannot find module')) {
      console.error('  Please install required packages: npm install imap-simple mailparser');
    }
    stats.errors++;
  }

  console.log(`✓ Email fetch completed: ${stats.processed} processed, ${stats.created} created, ${stats.errors} errors`);
  return stats;
}

