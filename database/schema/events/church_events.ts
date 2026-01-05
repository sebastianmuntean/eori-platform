import { pgTable, uuid, varchar, text, date, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

// Event type enum: wedding, baptism, funeral
export const eventTypeEnum = pgEnum('event_type', ['wedding', 'baptism', 'funeral']);

// Event status enum: pending, confirmed, completed, cancelled
export const eventStatusEnum = pgEnum('event_status', ['pending', 'confirmed', 'completed', 'cancelled']);

export const churchEvents = pgTable('church_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  type: eventTypeEnum('type').notNull(),
  status: eventStatusEnum('status').notNull().default('pending'),
  eventDate: date('event_date'),
  location: varchar('location', { length: 255 }),
  priestName: varchar('priest_name', { length: 255 }),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});
