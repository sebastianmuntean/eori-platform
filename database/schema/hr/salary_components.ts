import { pgTable, uuid, varchar, numeric, text, boolean, timestamp } from 'drizzle-orm/pg-core';
import { salaries } from './salaries';
import { salaryComponentTypeEnum } from './enums';

export const salaryComponents = pgTable('salary_components', {
  id: uuid('id').primaryKey().defaultRandom(),
  salaryId: uuid('salary_id').notNull().references(() => salaries.id, { onDelete: 'cascade' }),
  componentType: salaryComponentTypeEnum('component_type').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  isPercentage: boolean('is_percentage').notNull().default(false),
  percentageValue: numeric('percentage_value', { precision: 5, scale: 2 }),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

