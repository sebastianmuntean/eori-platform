import { pgTable, uuid, varchar, text, integer, boolean, date, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

export const catechesisClasses = pgTable('catechesis_classes', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  grade: varchar('grade', { length: 50 }),
  teacherId: uuid('teacher_id').references(() => users.id),
  startDate: date('start_date'),
  endDate: date('end_date'),
  maxStudents: integer('max_students'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});







