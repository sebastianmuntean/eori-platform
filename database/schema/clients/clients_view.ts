import { pgView, varchar, uuid, text, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

/**
 * View for clients with calculated "name" field
 * name = companyName for companies, firstName + lastName for individuals
 */
export const clientsView = pgView('clients_view', {
  id: uuid('id'),
  code: varchar('code', { length: 50 }),
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
  isActive: boolean('is_active'),
  createdAt: timestamp('created_at', { withTimezone: true }),
  createdBy: uuid('created_by'),
  updatedAt: timestamp('updated_at', { withTimezone: true }),
  updatedBy: uuid('updated_by'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  name: varchar('name', { length: 500 }), // Calculated field
}).existing();



