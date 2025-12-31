import { pgTable, uuid, varchar, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Library Domains table (Subject categories)
 */
export const libraryDomains = pgTable("library_domains", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").references(() => parishes.id, { onDelete: "cascade" }), // NULL = global
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  parentId: uuid("parent_id"), // Self-reference for hierarchy
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("library_domains_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_library_domains_parish").on(table.parishId),
  idxParent: index("idx_library_domains_parent").on(table.parentId),
}));

export type LibraryDomain = typeof libraryDomains.$inferSelect;
export type NewLibraryDomain = typeof libraryDomains.$inferInsert;
