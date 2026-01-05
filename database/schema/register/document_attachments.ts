import { pgTable, uuid, varchar, text, timestamp, integer, boolean, bigint } from 'drizzle-orm/pg-core';
import { documentRegistry } from './document_registry';
import { users } from '../superadmin/users';

export const documentAttachments = pgTable('document_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documentRegistry.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  storageName: varchar('storage_name', { length: 255 }).notNull(),
  storagePath: text('storage_path').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  version: integer('version').notNull().default(1),
  isSigned: boolean('is_signed').notNull().default(false),
  signedBy: uuid('signed_by').references(() => users.id),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

