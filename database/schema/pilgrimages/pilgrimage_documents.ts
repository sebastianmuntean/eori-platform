import { pgTable, uuid, varchar, text, timestamp, bigint, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { pilgrimages } from './pilgrimages';
import { users } from '../superadmin/users';

// Document type enum
export const pilgrimageDocumentTypeEnum = pgEnum('document_type', [
  'program',
  'information',
  'contract',
  'insurance',
  'visa_info',
  'other',
]);

export const pilgrimageDocuments = pgTable('pilgrimage_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  pilgrimageId: uuid('pilgrimage_id').notNull().references(() => pilgrimages.id, { onDelete: 'cascade' }),
  documentType: pilgrimageDocumentTypeEnum('document_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  filePath: text('file_path').notNull(),
  fileSize: bigint('file_size', { mode: 'number' }),
  mimeType: varchar('mime_type', { length: 100 }),
  isPublic: boolean('is_public').default(false),
  uploadedBy: uuid('uploaded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});



