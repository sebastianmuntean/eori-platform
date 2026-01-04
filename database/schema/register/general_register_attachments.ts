import { pgTable, uuid, varchar, text, timestamp, integer, boolean, bigint } from 'drizzle-orm/pg-core';
import { generalRegister } from './general_register';
import { generalRegisterWorkflow } from './general_register_workflow';
import { users } from '../superadmin/users';

export const generalRegisterAttachments = pgTable('general_register_attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => generalRegister.id, { onDelete: 'cascade' }),
  workflowStepId: uuid('workflow_step_id').references(() => generalRegisterWorkflow.id, { onDelete: 'cascade' }), // Optional: if null, attachment is global to document; if set, attachment belongs to specific workflow step
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

