import { pgTable, uuid, varchar, text, integer, boolean, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { libraryAuthors } from './library_authors';
import { libraryPublishers } from './library_publishers';
import { libraryDomains } from './library_domains';

export const bookStatusEnum = pgEnum('book_status', ['available', 'borrowed', 'reserved', 'damaged', 'lost']);

export const libraryBooks = pgTable('library_books', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id),
  code: varchar('code', { length: 50 }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  authorId: uuid('author_id').references(() => libraryAuthors.id),
  publisherId: uuid('publisher_id').references(() => libraryPublishers.id),
  domainId: uuid('domain_id').references(() => libraryDomains.id),
  isbn: varchar('isbn', { length: 20 }),
  publicationYear: integer('publication_year'),
  pages: integer('pages'),
  copies: integer('copies').default(1),
  availableCopies: integer('available_copies').default(1),
  location: varchar('location', { length: 100 }),
  status: bookStatusEnum('status').default('available'),
  isLoanable: boolean('is_loanable').default(true),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});




