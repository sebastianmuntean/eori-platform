import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { onlineFormSubmissions } from './online_form_submissions';

export const onlineFormEmailValidations = pgTable('online_form_email_validations', {
  id: uuid('id').primaryKey().defaultRandom(),
  submissionId: uuid('submission_id').notNull().references(() => onlineFormSubmissions.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  validationCode: varchar('validation_code', { length: 10 }).notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});








