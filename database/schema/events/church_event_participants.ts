import { pgTable, uuid, varchar, text, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { churchEvents } from './church_events';
import { clients } from '../clients/clients';

// Participant role enum: bride, groom, baptized, deceased, godparent, witness, parent, other
export const participantRoleEnum = pgEnum('participant_role', [
  'bride',
  'groom',
  'baptized',
  'deceased',
  'godparent',
  'witness',
  'parent',
  'other',
]);

export const churchEventParticipants = pgTable('church_event_participants', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventId: uuid('event_id').notNull().references(() => churchEvents.id, { onDelete: 'cascade' }),
  parishionerId: uuid('parishioner_id').references(() => clients.id),
  role: participantRoleEnum('role').notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }),
  birthDate: date('birth_date'),
  cnp: varchar('cnp', { length: 13 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
