import { pgTable, uuid, varchar, text, date, numeric, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { clients } from '../clients/clients';
import { users } from '../superadmin/users';
import { warehouses } from './warehouses';

// Invoice type enum: issued, received
export const invoiceTypeEnum = pgEnum('invoice_type', ['issued', 'received']);

// Invoice status enum: draft, sent, paid, overdue, cancelled
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled']);

export const invoices = pgTable('invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  series: varchar('series', { length: 20 }).notNull().default('INV'),
  number: numeric('number', { precision: 10, scale: 0 }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 50 }).notNull(),
  type: invoiceTypeEnum('type').notNull(),
  date: date('date').notNull(),
  dueDate: date('due_date').notNull(),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  vat: numeric('vat', { precision: 10, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('RON'),
  status: invoiceStatusEnum('status').notNull().default('draft'),
  paymentDate: date('payment_date'),
  description: text('description'),
  items: jsonb('items').default('[]'),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

