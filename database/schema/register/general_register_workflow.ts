import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { generalRegister } from './general_register';
import { users } from '../superadmin/users';
import { generalRegisterWorkflowActionEnum, generalRegisterStepStatusEnum, generalRegisterResolutionStatusEnum } from './enums';

export const generalRegisterWorkflow = pgTable('general_register_workflow', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => generalRegister.id, { onDelete: 'cascade' }),
  parentStepId: uuid('parent_step_id').references(() => generalRegisterWorkflow.id, { onDelete: 'set null' }),
  fromUserId: uuid('from_user_id').references(() => users.id),
  toUserId: uuid('to_user_id').references(() => users.id),
  action: generalRegisterWorkflowActionEnum('action').notNull(),
  stepStatus: generalRegisterStepStatusEnum('step_status').notNull().default('pending'),
  resolutionStatus: generalRegisterResolutionStatusEnum('resolution_status'),
  resolution: text('resolution'),
  notes: text('notes'),
  isExpired: boolean('is_expired').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

