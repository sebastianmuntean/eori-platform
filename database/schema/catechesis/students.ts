import { pgTable, uuid, varchar, text, date, boolean, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

export const catechesisStudents = pgTable('catechesis_students', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  parentName: varchar('parent_name', { length: 255 }),
  parentEmail: varchar('parent_email', { length: 255 }),
  parentPhone: varchar('parent_phone', { length: 50 }),
  address: text('address'),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});







