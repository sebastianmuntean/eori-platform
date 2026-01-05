import { pgTable, uuid, varchar, text, date, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { pilgrimages } from './pilgrimages';
import { pilgrimageParticipants } from './pilgrimage_participants';
import { users } from '../superadmin/users';

// Payment method enum
export const pilgrimagePaymentMethodEnum = pgEnum('payment_method', [
  'cash',
  'card',
  'bank_transfer',
  'other',
]);

// Payment status enum (different from participant payment status)
export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
]);

export const pilgrimagePayments = pgTable('pilgrimage_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  pilgrimageId: uuid('pilgrimage_id').notNull().references(() => pilgrimages.id, { onDelete: 'cascade' }),
  participantId: uuid('participant_id').notNull().references(() => pilgrimageParticipants.id, { onDelete: 'cascade' }),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentDate: date('payment_date').notNull(),
  paymentMethod: pilgrimagePaymentMethodEnum('payment_method').notNull(),
  paymentReference: varchar('payment_reference', { length: 255 }),
  status: paymentStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});



