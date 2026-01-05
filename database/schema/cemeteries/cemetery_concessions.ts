import { pgTable, uuid, varchar, date, numeric, boolean, integer, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { cemeteryGraves } from './cemetery_graves';
import { cemeteries } from './cemeteries';
import { parishes } from '../core/parishes';
import { clients } from '../clients/clients';
import { users } from '../superadmin/users';

export const concessionStatusEnum = pgEnum('concession_status', ['active', 'expired', 'cancelled', 'pending']);

export const cemeteryConcessions = pgTable('concessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  graveId: uuid('grave_id').notNull().references(() => cemeteryGraves.id),
  cemeteryId: uuid('cemetery_id').notNull().references(() => cemeteries.id),
  parishId: uuid('parish_id').notNull().references(() => parishes.id),
  holderClientId: uuid('holder_client_id').notNull().references(() => clients.id),
  contractNumber: varchar('contract_number', { length: 50 }).notNull(),
  contractDate: date('contract_date').notNull(),
  startDate: date('start_date').notNull(),
  expiryDate: date('expiry_date').notNull(),
  durationYears: integer('duration_years').notNull(),
  annualFee: numeric('annual_fee', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('RON'),
  status: concessionStatusEnum('status').default('active'),
  isExpired: boolean('is_expired').default(false),
  expiresInDays: integer('expires_in_days'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});




