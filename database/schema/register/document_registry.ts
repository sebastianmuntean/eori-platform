import { pgTable, uuid, varchar, text, date, timestamp, integer, boolean } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';
import { departments } from '../core/departments';
import { clients } from '../clients/clients';
import { documentTypeEnum, documentPriorityEnum, documentStatusEnum } from './enums';

export const documentRegistry = pgTable('document_registry', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  registrationNumber: integer('registration_number'),
  registrationYear: integer('registration_year'),
  formattedNumber: varchar('formatted_number', { length: 50 }),
  documentType: documentTypeEnum('document_type').notNull(),
  registrationDate: date('registration_date'),
  externalNumber: varchar('external_number', { length: 100 }),
  externalDate: date('external_date'),
  senderClientId: uuid('sender_client_id').references(() => clients.id),
  senderName: varchar('sender_name', { length: 255 }),
  senderDocNumber: varchar('sender_doc_number', { length: 100 }),
  senderDocDate: date('sender_doc_date'),
  recipientClientId: uuid('recipient_client_id').references(() => clients.id),
  recipientName: varchar('recipient_name', { length: 255 }),
  subject: varchar('subject', { length: 500 }).notNull(),
  content: text('content'),
  priority: documentPriorityEnum('priority').notNull().default('normal'),
  status: documentStatusEnum('status').notNull().default('draft'),
  departmentId: uuid('department_id').references(() => departments.id),
  assignedTo: uuid('assigned_to').references(() => users.id),
  dueDate: date('due_date'),
  resolvedDate: date('resolved_date'),
  fileIndex: varchar('file_index', { length: 50 }),
  parentDocumentId: uuid('parent_document_id'),
  isSecret: boolean('is_secret').notNull().default(false),
  secretDeclassificationList: text('secret_declassification_list').array(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

