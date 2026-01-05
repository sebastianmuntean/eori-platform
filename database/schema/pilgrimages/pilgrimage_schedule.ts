import { pgTable, uuid, varchar, text, date, time, timestamp, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { pilgrimages } from './pilgrimages';

// Activity type enum
export const activityTypeEnum = pgEnum('activity_type', [
  'liturgy',
  'prayer',
  'visit',
  'meal',
  'transport',
  'accommodation',
  'other',
]);

export const pilgrimageSchedule = pgTable('pilgrimage_schedule', {
  id: uuid('id').primaryKey().defaultRandom(),
  pilgrimageId: uuid('pilgrimage_id').notNull().references(() => pilgrimages.id, { onDelete: 'cascade' }),
  dayNumber: integer('day_number'),
  date: date('date'),
  time: time('time'),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 255 }),
  activityType: activityTypeEnum('activity_type').notNull(),
  durationMinutes: integer('duration_minutes'),
  isOptional: boolean('is_optional').default(false),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});



