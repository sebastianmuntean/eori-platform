import { pgTable, uuid, varchar, text, date, numeric, timestamp, integer, unique } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { users } from '../superadmin/users';
import { employmentContractTypeEnum, employmentContractStatusEnum } from './enums';

export const employmentContracts = pgTable('employment_contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  contractNumber: varchar('contract_number', { length: 50 }).notNull(),
  contractType: employmentContractTypeEnum('contract_type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  probationEndDate: date('probation_end_date'),
  baseSalary: numeric('base_salary', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('RON'),
  workingHoursPerWeek: integer('working_hours_per_week').notNull(),
  workLocation: varchar('work_location', { length: 255 }),
  jobDescription: text('job_description'),
  status: employmentContractStatusEnum('status').notNull().default('draft'),
  terminationDate: date('termination_date'),
  terminationReason: text('termination_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  uniqueContractNumber: unique().on(table.contractNumber),
}));

