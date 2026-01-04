import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { churchEvents } from './church_events';

// Email submission status enum: pending, processed, error
export const emailSubmissionStatusEnum = pgEnum('email_submission_status', ['pending', 'processed', 'error']);

export const churchEventEmailSubmissions = pgTable('church_event_email_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').references(() => churchEvents.id, { onDelete: 'set null' }),
  fromEmail: varchar('from_email', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 500 }),
  content: text('content').notNull(),
  status: emailSubmissionStatusEnum('status').notNull().default('pending'),
  errorMessage: text('error_message'),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
