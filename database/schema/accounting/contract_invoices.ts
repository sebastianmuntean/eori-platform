import { pgTable, uuid, integer, timestamp, unique } from 'drizzle-orm/pg-core';
import { contracts } from './contracts';
import { invoices } from './invoices';
import { users } from '../superadmin/users';

export const contractInvoices = pgTable('contract_invoices', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  invoiceId: uuid('invoice_id').notNull().references(() => invoices.id, { onDelete: 'cascade' }),
  periodYear: integer('period_year').notNull(),
  periodMonth: integer('period_month').notNull(), // 1-12
  generatedAt: timestamp('generated_at', { withTimezone: true }).notNull().defaultNow(),
  generatedBy: uuid('generated_by').references(() => users.id),
}, (table) => ({
  uniqueContractPeriod: unique().on(table.contractId, table.periodYear, table.periodMonth),
}));



