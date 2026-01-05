import { pgTable, uuid, date, numeric, text, timestamp } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { users } from '../superadmin/users';
import { evaluationStatusEnum } from './enums';

export const evaluations = pgTable('evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  evaluatorId: uuid('evaluator_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  evaluationPeriodStart: date('evaluation_period_start').notNull(),
  evaluationPeriodEnd: date('evaluation_period_end').notNull(),
  evaluationDate: date('evaluation_date').notNull(),
  overallScore: numeric('overall_score', { precision: 5, scale: 2 }),
  overallComment: text('overall_comment'),
  strengths: text('strengths'),
  improvementAreas: text('improvement_areas'),
  status: evaluationStatusEnum('status').notNull().default('draft'),
  acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

