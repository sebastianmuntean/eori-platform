import { pgTable, uuid, varchar, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Library Publishers table (Edituri)
 */
export const libraryPublishers = pgTable("library_publishers", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").references(() => parishes.id, { onDelete: "cascade" }), // NULL = global
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("library_publishers_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_library_publishers_parish").on(table.parishId),
  idxName: index("idx_library_publishers_name").on(table.name),
}));

export type LibraryPublisher = typeof libraryPublishers.$inferSelect;
export type NewLibraryPublisher = typeof libraryPublishers.$inferInsert;
