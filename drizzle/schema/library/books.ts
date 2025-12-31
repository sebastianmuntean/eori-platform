import { pgTable, uuid, varchar, text, boolean, integer, timestamp, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { libraryAuthors } from "./authors";
import { libraryPublishers } from "./publishers";
import { libraryDomains } from "./domains";

/**
 * Book status enum
 */
export const bookStatusEnum = pgEnum("book_status", ["available", "borrowed", "reserved", "damaged", "lost"]);

/**
 * Library Books table
 */
export const libraryBooks = pgTable("library_books", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  code: varchar("code", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  authorId: uuid("author_id").references(() => libraryAuthors.id, { onDelete: "set null" }),
  publisherId: uuid("publisher_id").references(() => libraryPublishers.id, { onDelete: "set null" }),
  domainId: uuid("domain_id").references(() => libraryDomains.id, { onDelete: "set null" }),
  isbn: varchar("isbn", { length: 20 }),
  publicationYear: integer("publication_year"),
  pages: integer("pages"),
  copies: integer("copies").default(1),
  availableCopies: integer("available_copies").default(1),
  location: varchar("location", { length: 100 }), // Shelf/Room
  status: bookStatusEnum("status").default("available"),
  isLoanable: boolean("is_loanable").default(true),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("library_books_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_library_books_parish").on(table.parishId),
  idxAuthor: index("idx_library_books_author").on(table.authorId),
  idxPublisher: index("idx_library_books_publisher").on(table.publisherId),
  idxDomain: index("idx_library_books_domain").on(table.domainId),
  idxStatus: index("idx_library_books_status").on(table.parishId, table.status),
  idxIsbn: index("idx_library_books_isbn").on(table.isbn),
  idxTitle: index("idx_library_books_title").on(table.title),
}));

export type LibraryBook = typeof libraryBooks.$inferSelect;
export type NewLibraryBook = typeof libraryBooks.$inferInsert;
