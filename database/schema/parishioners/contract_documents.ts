import { pgTable, uuid, varchar, text, timestamp, bigint, pgEnum } from 'drizzle-orm/pg-core';
import { parishionerContracts } from './parishioner_contracts';
import { users } from '../superadmin/users';

// Document type enum: contract, amendment, renewal, other
export const contractDocumentTypeEnum = pgEnum('contract_document_type', ['contract', 'amendment', 'renewal', 'other']);

export const contractDocuments = pgTable('contract_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull().references(() => parishionerContracts.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  storageName: varchar('storage_name', { length: 255 }).notNull(),
  storagePath: text('storage_path').notNull(),
  mimeType: varchar('mime_type', { length: 100 }),
  fileSize: bigint('file_size', { mode: 'number' }).notNull(),
  documentType: contractDocumentTypeEnum('document_type').notNull().default('contract'),
  uploadedBy: uuid('uploaded_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

