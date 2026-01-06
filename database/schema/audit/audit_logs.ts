import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../superadmin/users';

// Audit action enum
export const auditActionEnum = pgEnum('audit_action', [
  'create',
  'update',
  'delete',
  'read',
  'login',
  'logout',
  'export',
  'import',
  'approve',
  'reject',
]);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  action: auditActionEnum('action').notNull(),
  resourceType: varchar('resource_type', { length: 100 }).notNull(),
  resourceId: uuid('resource_id'),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  requestMethod: varchar('request_method', { length: 10 }),
  endpoint: varchar('endpoint', { length: 255 }),
  changes: jsonb('changes'), // Before/after state for updates
  metadata: jsonb('metadata'), // Additional context
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});







