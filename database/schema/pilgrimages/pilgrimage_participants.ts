import { pgTable, uuid, varchar, text, date, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { pilgrimages } from './pilgrimages';
import { clients } from '../clients/clients';

// Participant status enum
export const participantStatusEnum = pgEnum('participant_status', [
  'registered',
  'confirmed',
  'paid',
  'cancelled',
  'waitlisted',
]);

// Participant payment status enum
export const participantPaymentStatusEnum = pgEnum('participant_payment_status', [
  'pending',
  'partial',
  'paid',
  'refunded',
]);

export const pilgrimageParticipants = pgTable('pilgrimage_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  pilgrimageId: uuid('pilgrimage_id').notNull().references(() => pilgrimages.id, { onDelete: 'cascade' }),
  parishionerId: uuid('parishioner_id').references(() => clients.id),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }),
  cnp: varchar('cnp', { length: 13 }),
  birthDate: date('birth_date'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  emergencyContactName: varchar('emergency_contact_name', { length: 255 }),
  emergencyContactPhone: varchar('emergency_contact_phone', { length: 50 }),
  specialNeeds: text('special_needs'),
  status: participantStatusEnum('status').notNull().default('registered'),
  registrationDate: timestamp('registration_date', { withTimezone: true }).notNull().defaultNow(),
  paymentStatus: participantPaymentStatusEnum('payment_status').notNull().default('pending'),
  totalAmount: decimal('total_amount', { precision: 10, scale: 2 }),
  paidAmount: decimal('paid_amount', { precision: 10, scale: 2 }).default('0'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

