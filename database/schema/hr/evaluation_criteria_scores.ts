import { pgTable, uuid, numeric, text, timestamp } from 'drizzle-orm/pg-core';
import { evaluations } from './evaluations';
import { evaluationCriteria } from './evaluation_criteria';

export const evaluationCriteriaScores = pgTable('evaluation_criteria_scores', {
  id: uuid('id').primaryKey().defaultRandom(),
  evaluationId: uuid('evaluation_id').notNull().references(() => evaluations.id, { onDelete: 'cascade' }),
  criterionId: uuid('criterion_id').notNull().references(() => evaluationCriteria.id, { onDelete: 'restrict' }),
  score: numeric('score', { precision: 5, scale: 2 }).notNull(),
  comment: text('comment'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

