import { pgTable, uuid, date, numeric, varchar, text, timestamp, uuid as uuidType } from 'drizzle-orm/pg-core';
import { cemeteryConcessions } from './cemetery_concessions';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

export const cemeteryConcessionPayments = pgTable('concession_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  concessionId: uuid('concession_id').notNull().references(() => cemeteryConcessions.id),
  parishId: uuid('parish_id').notNull().references(() => parishes.id),
  paymentDate: date('payment_date').notNull(),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('RON'),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  receiptNumber: varchar('receipt_number', { length: 50 }),
  receiptDate: date('receipt_date'),
  transactionId: uuidType('transaction_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});




