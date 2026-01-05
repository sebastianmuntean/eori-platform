import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { documentRegistry } from './document_registry';
import { users } from '../superadmin/users';
import { departments } from '../core/departments';
import { workflowActionEnum } from './enums';

export const documentWorkflow = pgTable('document_workflow', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documentRegistry.id, { onDelete: 'cascade' }),
  fromUserId: uuid('from_user_id').references(() => users.id),
  toUserId: uuid('to_user_id').references(() => users.id),
  fromDepartmentId: uuid('from_department_id').references(() => departments.id),
  toDepartmentId: uuid('to_department_id').references(() => departments.id),
  action: workflowActionEnum('action').notNull(),
  resolution: text('resolution'),
  notes: text('notes'),
  isExpired: boolean('is_expired').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

