import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const permissions = pgTable('permissions', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  description: text('description'),
  resource: text('resource').notNull(),
  action: text('action').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

