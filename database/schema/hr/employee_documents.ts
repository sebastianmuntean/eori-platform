import { pgTable, uuid, varchar, text, date, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { employmentContracts } from './employment_contracts';
import { users } from '../superadmin/users';
import { employeeDocumentTypeEnum } from './enums';

export const employeeDocuments = pgTable('employee_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  contractId: uuid('contract_id').references(() => employmentContracts.id, { onDelete: 'set null' }),
  documentType: employeeDocumentTypeEnum('document_type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  filePath: varchar('file_path', { length: 500 }).notNull(),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  issueDate: date('issue_date'),
  expiryDate: date('expiry_date'),
  isConfidential: boolean('is_confidential').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

