import { pgTable, uuid, varchar, text, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { onlineForms } from './online_forms';
import { users } from '../superadmin/users';

// Form submission status enum
export const formSubmissionStatusEnum = pgEnum('form_submission_status', [
  'pending_validation',
  'validated',
  'processing',
  'completed',
  'rejected',
]);

export const onlineFormSubmissions = pgTable('online_form_submissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull().references(() => onlineForms.id, { onDelete: 'cascade' }),
  submissionToken: varchar('submission_token', { length: 100 }).notNull().unique(),
  status: formSubmissionStatusEnum('status').notNull().default('pending_validation'),
  email: varchar('email', { length: 255 }),
  emailValidatedAt: timestamp('email_validated_at', { withTimezone: true }),
  formData: jsonb('form_data').notNull(), // JSON object with form field values
  targetRecordId: uuid('target_record_id'), // ID of the record created in target module
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
  processedAt: timestamp('processed_at', { withTimezone: true }),
  processedBy: uuid('processed_by').references(() => users.id),
});


