import { pgTable, uuid, varchar, text, jsonb, timestamp, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../superadmin/users';
import { parishes } from '../core/parishes';
import { dioceses } from '../core/dioceses';

// Chart type enum
export const chartTypeEnum = pgEnum('chart_type', [
  'line',
  'bar',
  'pie',
  'area',
  'scatter',
]);

// Report type enum
export const reportTypeEnum = pgEnum('report_type', [
  'user_activity',
  'document_creation',
  'event_statistics',
  'financial_summary',
  'parishioner_growth',
  'custom',
]);

export const savedReports = pgTable('saved_reports', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  reportType: reportTypeEnum('report_type').notNull(),
  chartType: chartTypeEnum('chart_type').notNull(),
  
  // Filters
  dateRange: jsonb('date_range'), // { start: string, end: string }
  parishId: uuid('parish_id').references(() => parishes.id, { onDelete: 'set null' }),
  dioceseId: uuid('diocese_id').references(() => dioceses.id, { onDelete: 'set null' }),
  
  // Report configuration
  config: jsonb('config').notNull(), // Chart configuration, metrics, etc.
  
  // Sharing
  isPublic: boolean('is_public').default(false),
  sharedWith: jsonb('shared_with'), // Array of user IDs
  
  // Metadata
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  lastGeneratedAt: timestamp('last_generated_at', { withTimezone: true }),
});

