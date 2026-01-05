import { pgTable, uuid, varchar, text, date, numeric, timestamp, boolean, pgEnum, unique } from 'drizzle-orm/pg-core';
import { clients } from '../clients/clients';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

// Contract type enum: donation, service, rental, other
export const parishionerContractTypeEnum = pgEnum('parishioner_contract_type', ['donation', 'service', 'rental', 'other']);

// Contract status enum: draft, active, expired, terminated, renewed
export const parishionerContractStatusEnum = pgEnum('parishioner_contract_status', ['draft', 'active', 'expired', 'terminated', 'renewed']);

export const parishionerContracts = pgTable('parishioner_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractNumber: varchar('contract_number', { length: 50 }).notNull(),
  parishionerId: uuid('parishioner_id').notNull().references(() => clients.id),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  contractType: parishionerContractTypeEnum('contract_type').notNull(),
  status: parishionerContractStatusEnum('status').notNull().default('draft'),
  title: varchar('title', { length: 255 }),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  signingDate: date('signing_date'),
  amount: numeric('amount', { precision: 15, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('RON'),
  terms: text('terms'),
  description: text('description'),
  notes: text('notes'),
  renewalDate: date('renewal_date'),
  autoRenewal: boolean('auto_renewal').default(false),
  // Self-reference: Points to the parent contract for renewals/amendments
  // Business Rule: A parishioner contract can be renewed, creating a new contract linked to the original
  // Constraint: Prevents deletion of parent if child contracts exist (enforced by 'restrict')
  // Validation: Application-level checks should prevent circular references
  // Note: Type assertion ((): any =>) is required to resolve TypeScript circular type inference
  parentContractId: uuid('parent_contract_id').references((): any => parishionerContracts.id, {
    onDelete: 'restrict', // Prevents deletion if child contracts exist
  }),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  uniqueContractNumber: unique().on(table.contractNumber),
}));

