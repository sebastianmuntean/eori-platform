import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

export const libraryDomains = pgTable('library_domains', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').references(() => parishes.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  // Self-reference: Points to the parent domain for hierarchical categorization
  // Business Rule: Library domains can be organized in a tree structure (categories/subcategories)
  // Constraint: Deleting a parent domain cascades to delete all child domains
  // Validation: Application-level checks should prevent circular references and excessive nesting
  // Note: Type assertion ((): any =>) is required to resolve TypeScript circular type inference
  parentId: uuid('parent_id').references((): any => libraryDomains.id, {
    onDelete: 'cascade', // Deleting parent domain deletes all child domains
  }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});






