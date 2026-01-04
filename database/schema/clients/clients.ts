import { pgTable, uuid, varchar, text, boolean, date, timestamp, unique } from 'drizzle-orm/pg-core';
import { users } from '../superadmin/users';
import { parishionerTypes } from '../parishioners/parishioner_types';
import { parishes } from '../core/parishes';

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  cnp: varchar('cnp', { length: 13 }),
  birthDate: date('birth_date'),
  companyName: varchar('company_name', { length: 255 }),
  cui: varchar('cui', { length: 20 }),
  regCom: varchar('reg_com', { length: 50 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  bankName: varchar('bank_name', { length: 255 }),
  iban: varchar('iban', { length: 34 }),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  // Parishioner-specific fields
  isParishioner: boolean('is_parishioner').default(false),
  parishionerTypeId: uuid('parishioner_type_id').references(() => parishionerTypes.id),
  nameDay: date('name_day'),
  parishId: uuid('parish_id').references(() => parishes.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
}, (table) => ({
  uniqueCode: unique().on(table.code),
}));

