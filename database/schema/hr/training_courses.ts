import { pgTable, uuid, varchar, text, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

export const trainingCourses = pgTable('training_courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').references(() => parishes.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  provider: varchar('provider', { length: 255 }),
  durationHours: integer('duration_hours'),
  cost: numeric('cost', { precision: 15, scale: 2 }),
  isCertified: boolean('is_certified').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

