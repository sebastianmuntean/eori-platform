import { pgTable, uuid, varchar, text, integer, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Library Authors table
 */
export const libraryAuthors = pgTable("library_authors", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").references(() => parishes.id, { onDelete: "cascade" }), // NULL = global
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  biography: text("biography"),
  birthYear: integer("birth_year"),
  deathYear: integer("death_year"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("library_authors_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_library_authors_parish").on(table.parishId),
  idxName: index("idx_library_authors_name").on(table.name),
}));

export type LibraryAuthor = typeof libraryAuthors.$inferSelect;
export type NewLibraryAuthor = typeof libraryAuthors.$inferInsert;
