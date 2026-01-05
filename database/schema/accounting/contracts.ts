import { pgTable, uuid, varchar, text, date, numeric, timestamp, pgEnum, boolean, jsonb } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { clients } from '../clients/clients';
import { users } from '../superadmin/users';

// Contract direction enum: incoming, outgoing
export const contractDirectionEnum = pgEnum('contract_direction', ['incoming', 'outgoing']);

// Contract type enum: rental, concession, sale_purchase, loan, other
export const contractTypeEnum = pgEnum('contract_type', ['rental', 'concession', 'sale_purchase', 'loan', 'other']);

// Contract status enum: draft, active, expired, terminated, renewed
export const contractStatusEnum = pgEnum('contract_status', ['draft', 'active', 'expired', 'terminated', 'renewed']);

// Payment frequency enum: monthly, quarterly, semiannual, annual, one_time, custom
export const paymentFrequencyEnum = pgEnum('payment_frequency', ['monthly', 'quarterly', 'semiannual', 'annual', 'one_time', 'custom']);

export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  contractNumber: varchar('contract_number', { length: 50 }).notNull(),
  direction: contractDirectionEnum('direction').notNull(),
  type: contractTypeEnum('type').notNull(),
  status: contractStatusEnum('status').notNull().default('draft'),
  clientId: uuid('client_id').notNull().references(() => clients.id),
  title: varchar('title', { length: 255 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  signingDate: date('signing_date'),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('RON'),
  paymentFrequency: paymentFrequencyEnum('payment_frequency').notNull(),
  assetReference: text('asset_reference'),
  description: text('description'),
  terms: text('terms'),
  notes: text('notes'),
  renewalDate: date('renewal_date'),
  autoRenewal: boolean('auto_renewal').default(false),
  parentContractId: uuid('parent_contract_id').references(() => contracts.id),
  invoiceItemTemplate: jsonb('invoice_item_template'), // Template for invoice line items
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

