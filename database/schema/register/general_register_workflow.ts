import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { generalRegister } from './general_register';
import { users } from '../superadmin/users';
import { generalRegisterWorkflowActionEnum, generalRegisterStepStatusEnum, generalRegisterResolutionStatusEnum } from './enums';

export const generalRegisterWorkflow = pgTable('general_register_workflow', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => generalRegister.id, { onDelete: 'cascade' }),
  // Self-reference: Points to the parent workflow step for nested approval chains
  // Business Rule: Workflow steps can be nested to support complex approval hierarchies
  // Constraint: Deleting a parent step sets child steps' parent to null (preserves workflow history)
  // Validation: Application-level checks should prevent circular references
  // Note: Type assertion ((): any =>) is required to resolve TypeScript circular type inference
  parentStepId: uuid('parent_step_id').references((): any => generalRegisterWorkflow.id, {
    onDelete: 'set null', // Preserves child steps when parent is deleted
  }),
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

