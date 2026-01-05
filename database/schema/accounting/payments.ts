import { pgTable, uuid, varchar, text, date, numeric, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { clients } from '../clients/clients';
import { users } from '../superadmin/users';

// Payment type enum: income, expense
export const paymentTypeEnum = pgEnum('payment_type', ['income', 'expense']);

// Payment method enum: cash, bank_transfer, card, check
export const accountingPaymentMethodEnum = pgEnum('payment_method', ['cash', 'bank_transfer', 'card', 'check']);

// Payment status enum: pending, completed, cancelled
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'completed', 'cancelled']);

export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  paymentNumber: varchar('payment_number', { length: 50 }).notNull(),
  date: date('date').notNull(),
  type: paymentTypeEnum('type').notNull(),
  category: varchar('category', { length: 100 }),
  clientId: uuid('client_id').references(() => clients.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('RON'),
  description: text('description'),
  paymentMethod: accountingPaymentMethodEnum('payment_method'),
  referenceNumber: varchar('reference_number', { length: 100 }),
  status: paymentStatusEnum('status').notNull().default('pending'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

