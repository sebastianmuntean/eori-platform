import { pgTable, uuid, date, numeric, timestamp, integer, varchar, text } from 'drizzle-orm/pg-core';
import { employees } from './employees';
import { employmentContracts } from './employment_contracts';
import { users } from '../superadmin/users';
import { salaryStatusEnum } from './enums';

export const salaries = pgTable('salaries', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  contractId: uuid('contract_id').notNull().references(() => employmentContracts.id, { onDelete: 'restrict' }),
  salaryPeriod: date('salary_period').notNull(),
  baseSalary: numeric('base_salary', { precision: 15, scale: 2 }).notNull(),
  grossSalary: numeric('gross_salary', { precision: 15, scale: 2 }).notNull(),
  netSalary: numeric('net_salary', { precision: 15, scale: 2 }).notNull(),
  totalBenefits: numeric('total_benefits', { precision: 15, scale: 2 }).notNull().default('0'),
  totalDeductions: numeric('total_deductions', { precision: 15, scale: 2 }).notNull().default('0'),
  workingDays: integer('working_days').notNull(),
  workedDays: integer('worked_days').notNull(),
  status: salaryStatusEnum('status').notNull().default('draft'),
  paidDate: date('paid_date'),
  paymentReference: varchar('payment_reference', { length: 100 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

