import { pgTable, uuid, varchar, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

export const libraryAuthors = pgTable('library_authors', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').references(() => parishes.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  biography: text('biography'),
  birthYear: integer('birth_year'),
  deathYear: integer('death_year'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});




