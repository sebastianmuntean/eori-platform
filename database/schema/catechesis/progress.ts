import { pgTable, uuid, numeric, integer, text, timestamp } from 'drizzle-orm/pg-core';
import { catechesisEnrollments } from './enrollments';
import { catechesisLessons } from './lessons';
import { progressStatusEnum } from './enums';

export const catechesisProgress = pgTable('catechesis_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  enrollmentId: uuid('enrollment_id').notNull().references(() => catechesisEnrollments.id, { onDelete: 'cascade' }),
  lessonId: uuid('lesson_id').notNull().references(() => catechesisLessons.id, { onDelete: 'cascade' }),
  status: progressStatusEnum('status').notNull().default('not_started'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  timeSpentMinutes: integer('time_spent_minutes'),
  score: numeric('score', { precision: 5, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});







