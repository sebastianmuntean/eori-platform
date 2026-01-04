import { pgTable, uuid, varchar, text, date, timestamp, integer } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';
import { registerConfigurations } from './register_configurations';
import { clients } from '../clients/clients';
import { documentTypeEnum, documentStatusEnum } from './enums';

export const generalRegister = pgTable('general_register', {
  id: uuid('id').primaryKey().defaultRandom(),
  registerConfigurationId: uuid('register_configuration_id').references(() => registerConfigurations.id, { onDelete: 'restrict' }), // Will be made NOT NULL after migrating existing documents
  parishId: uuid('parish_id').references(() => parishes.id, { onDelete: 'cascade' }),
  documentNumber: integer('document_number').notNull(),
  year: integer('year').notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  date: date('date').notNull(),
  subject: varchar('subject', { length: 500 }).notNull(),
  from: varchar('from', { length: 255 }),
  petitionerClientId: uuid('petitioner_client_id').references(() => clients.id),
  to: varchar('to', { length: 255 }),
  description: text('description'),
  filePath: text('file_path'),
  status: documentStatusEnum('status').notNull().default('draft'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});
