import { pgTable, uuid, varchar, text, timestamp, bigint } from 'drizzle-orm/pg-core';
import { receipts } from './receipts';
import { users } from '../superadmin/users';

export const receiptAttachments = pgTable('receipt_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptId: uuid('receipt_id').notNull().references(() => receipts.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  storageName: varchar('storage_name', { length: 255 }).notNull(),
  storagePath: text('storage_path').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});



