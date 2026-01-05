import { pgTable, uuid, varchar, text, serial, timestamp, date } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { clients } from '../clients/clients';

export const parishioners = pgTable('parishioners', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').references(() => parishes.id),
  clientId: uuid('client_id').references(() => clients.id),
  code: serial('code').unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }),
  birthDate: date('birth_date'),
  profession: varchar('profession', { length: 255 }),
  occupation: varchar('occupation', { length: 255 }),
  maritalStatus: varchar('marital_status', { length: 255 }),
  phone: varchar('phone', { length: 255 }),
  email: varchar('email', { length: 255 }),
  notes: text('notes'),
  classification: varchar('classification', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

