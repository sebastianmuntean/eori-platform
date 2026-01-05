import { pgTable, uuid, varchar, text, numeric, boolean, timestamp, unique } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { departments } from '../core/departments';

export const positions = pgTable('positions', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  code: varchar('code', { length: 50 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  minSalary: numeric('min_salary', { precision: 15, scale: 2 }),
  maxSalary: numeric('max_salary', { precision: 15, scale: 2 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueCode: unique().on(table.code),
}));

