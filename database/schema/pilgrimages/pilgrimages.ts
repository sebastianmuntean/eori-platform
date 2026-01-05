import { pgTable, uuid, varchar, text, date, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

// Pilgrimage status enum
export const pilgrimageStatusEnum = pgEnum('pilgrimage_status', [
  'draft',
  'open',
  'closed',
  'in_progress',
  'completed',
  'cancelled',
]);

export const pilgrimages = pgTable('pilgrimages', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  destination: varchar('destination', { length: 255 }),
  startDate: date('start_date'),
  endDate: date('end_date'),
  registrationDeadline: date('registration_deadline'),
  maxParticipants: integer('max_participants'),
  minParticipants: integer('min_participants'),
  status: pilgrimageStatusEnum('status').notNull().default('draft'),
  pricePerPerson: decimal('price_per_person', { precision: 10, scale: 2 }),
  currency: varchar('currency', { length: 3 }).default('RON'),
  organizerName: varchar('organizer_name', { length: 255 }),
  organizerContact: varchar('organizer_contact', { length: 255 }),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});



