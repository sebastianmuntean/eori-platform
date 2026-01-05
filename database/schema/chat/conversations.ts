import { pgTable, uuid, varchar, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { users } from '../superadmin/users';

// Conversation type enum
export const conversationTypeEnum = pgEnum('conversation_type', [
  'direct',
  'group',
]);

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }), // Nullable for direct conversations, required for groups
  type: conversationTypeEnum('type').notNull().default('direct'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

