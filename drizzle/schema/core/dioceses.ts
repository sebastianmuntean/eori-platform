import { pgTable, uuid, varchar, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

/**
 * Dioceses table (Episcopii/Dieceze)
 * Top-level organizational unit in the church hierarchy
 */
export const dioceses = pgTable("dioceses", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  country: varchar("country", { length: 100 }).default("România"),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  bishopName: varchar("bishop_name", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxActive: index("idx_dioceses_active").on(table.isActive),
  idxCode: index("idx_dioceses_code").on(table.code),
}));

export type Diocese = typeof dioceses.$inferSelect;
export type NewDiocese = typeof dioceses.$inferInsert;
