import { pgTable, uuid, varchar, text, date, numeric, timestamp, pgEnum, unique } from 'drizzle-orm/pg-core';
import { clients } from '../clients/clients';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

// Receipt status enum: draft, issued, cancelled
export const receiptStatusEnum = pgEnum('receipt_status', ['draft', 'issued', 'cancelled']);

export const receipts = pgTable('receipts', {
  id: uuid('id').primaryKey().defaultRandom(),
  receiptNumber: varchar('receipt_number', { length: 50 }).notNull(),
  parishionerId: uuid('parishioner_id').notNull().references(() => clients.id),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  receiptDate: date('receipt_date').notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('RON'),
  purpose: text('purpose'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  status: receiptStatusEnum('status').notNull().default('draft'),
  notes: text('notes'),
  issuedBy: uuid('issued_by').references(() => users.id),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  uniqueReceiptNumber: unique().on(table.receiptNumber),
}));

