import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

// Email validation mode enum
export const emailValidationModeEnum = pgEnum('email_validation_mode', ['start', 'end']);

// Submission flow enum
export const submissionFlowEnum = pgEnum('submission_flow', ['direct', 'review']);

// Target module enum
export const formTargetModuleEnum = pgEnum('form_target_module', [
  'registratura',
  'general_register',
  'events',
  'clients',
]);

export const onlineForms = pgTable('online_forms', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isActive: boolean('is_active').notNull().default(true),
  emailValidationMode: emailValidationModeEnum('email_validation_mode').notNull().default('end'),
  submissionFlow: submissionFlowEnum('submission_flow').notNull().default('review'),
  targetModule: formTargetModuleEnum('target_module').notNull(),
  widgetCode: varchar('widget_code', { length: 100 }).notNull().unique(),
  successMessage: text('success_message'),
  errorMessage: text('error_message'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});


