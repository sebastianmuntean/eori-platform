import { pgTable, uuid, date, numeric, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { trainingCourses } from './training_courses';
import { users } from '../superadmin/users';
import { employeeTrainingStatusEnum } from './enums';

export const employeeTraining = pgTable('employee_training', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').notNull().references(() => trainingCourses.id, { onDelete: 'restrict' }),
  enrollmentDate: date('enrollment_date').notNull(),
  completionDate: date('completion_date'),
  status: employeeTrainingStatusEnum('status').notNull().default('enrolled'),
  score: numeric('score', { precision: 5, scale: 2 }),
  certificateNumber: varchar('certificate_number', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

