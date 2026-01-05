import { pgTable, uuid, varchar, text, date, timestamp, boolean, unique } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { departments } from '../core/departments';
import { users } from '../superadmin/users';
import { positions } from './positions';
import { genderEnum, employmentStatusEnum } from './enums';

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
  employeeNumber: varchar('employee_number', { length: 50 }).notNull(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  cnp: varchar('cnp', { length: 13 }),
  birthDate: date('birth_date'),
  gender: genderEnum('gender'),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  departmentId: uuid('department_id').references(() => departments.id, { onDelete: 'set null' }),
  positionId: uuid('position_id').references(() => positions.id, { onDelete: 'set null' }),
  hireDate: date('hire_date').notNull(),
  employmentStatus: employmentStatusEnum('employment_status').notNull().default('active'),
  terminationDate: date('termination_date'),
  terminationReason: text('termination_reason'),
  bankName: varchar('bank_name', { length: 255 }),
  iban: varchar('iban', { length: 34 }),
  notes: text('notes'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  uniqueEmployeeNumber: unique().on(table.employeeNumber),
  uniqueCnp: unique().on(table.cnp),
}));

