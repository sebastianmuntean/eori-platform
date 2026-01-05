import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core';
import { catechesisClasses } from './classes';
import { catechesisStudents } from './students';
import { enrollmentStatusEnum } from './enums';

export const catechesisEnrollments = pgTable('catechesis_enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  classId: uuid('class_id').notNull().references(() => catechesisClasses.id, { onDelete: 'cascade' }),
  studentId: uuid('student_id').notNull().references(() => catechesisStudents.id, { onDelete: 'cascade' }),
  enrolledAt: timestamp('enrolled_at', { withTimezone: true }).notNull().defaultNow(),
  status: enrollmentStatusEnum('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});



