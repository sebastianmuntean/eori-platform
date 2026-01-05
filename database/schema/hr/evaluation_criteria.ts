import { pgTable, uuid, varchar, text, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

export const evaluationCriteria = pgTable('evaluation_criteria', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').references(() => parishes.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  maxScore: integer('max_score').notNull().default(100),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull().default('1.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

