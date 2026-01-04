import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { churchEvents } from './church_events';
import { users } from '../superadmin/users';

export const churchEventDocuments = pgTable('church_event_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => churchEvents.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileType: varchar('file_type', { length: 50 }),
  fileSize: varchar('file_size', { length: 50 }),
  description: text('description'),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
