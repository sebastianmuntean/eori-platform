import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

export const libraryDomains = pgTable('library_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').references(() => parishes.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  parentId: uuid('parent_id').references(() => libraryDomains.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});




