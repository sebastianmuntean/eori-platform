import { pgTable, uuid, date, timestamp, numeric, text, integer } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { users } from '../superadmin/users';
import { timeEntryStatusEnum } from './enums';

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  entryDate: date('entry_date').notNull(),
  checkInTime: timestamp('check_in_time', { withTimezone: true }),
  checkOutTime: timestamp('check_out_time', { withTimezone: true }),
  breakDurationMinutes: integer('break_duration_minutes').notNull().default(0),
  workedHours: numeric('worked_hours', { precision: 5, scale: 2 }),
  overtimeHours: numeric('overtime_hours', { precision: 5, scale: 2 }).notNull().default('0'),
  status: timeEntryStatusEnum('status').notNull().default('present'),
  notes: text('notes'),
  approvedBy: uuid('approved_by').references(() => users.id),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

