import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { pilgrimages } from './pilgrimages';
import { users } from '../superadmin/users';

// Workflow action enum
export const workflowActionEnum = pgEnum('workflow_action', [
  'created',
  'approved',
  'rejected',
  'published',
  'closed',
  'cancelled',
]);

export const pilgrimageWorkflow = pgTable('pilgrimage_workflow', {
  id: uuid('id').primaryKey().defaultRandom(),
  pilgrimageId: uuid('pilgrimage_id').notNull().references(() => pilgrimages.id, { onDelete: 'cascade' }),
  action: workflowActionEnum('action').notNull(),
  fromStatus: varchar('from_status', { length: 50 }),
  toStatus: varchar('to_status', { length: 50 }),
  performedBy: uuid('performed_by').references(() => users.id),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});



