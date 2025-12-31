import { pgTable, uuid, varchar, text, boolean, timestamp, integer, decimal, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Cemeteries table
 * Main cemetery entity belonging to a parish
 */
export const cemeteries = pgTable("cemeteries", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  code: varchar("code", { length: 20 }).notNull(), // CIM-01
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  
  totalArea: decimal("total_area", { precision: 10, scale: 2 }), // sqm
  totalPlots: integer("total_plots"),
  
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("cemeteries_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_cemeteries_parish").on(table.parishId),
  idxActive: index("idx_cemeteries_active").on(table.parishId, table.isActive),
}));

export type Cemetery = typeof cemeteries.$inferSelect;
export type NewCemetery = typeof cemeteries.$inferInsert;
