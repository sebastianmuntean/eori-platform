import { pgTable, uuid, varchar, integer, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Receipt Series table
 * Manages receipt number series for each parish
 */
export const receiptSeries = pgTable("receipt_series", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  series: varchar("series", { length: 20 }).notNull(),
  startNumber: integer("start_number").notNull(),
  endNumber: integer("end_number").notNull(),
  currentNumber: integer("current_number").notNull(),
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishSeries: unique("receipt_series_parish_series_unique").on(table.parishId, table.series),
  idxParish: index("idx_receipt_series_parish").on(table.parishId),
  idxActive: index("idx_receipt_series_active").on(table.parishId, table.isActive),
}));

export type ReceiptSeries = typeof receiptSeries.$inferSelect;
export type NewReceiptSeries = typeof receiptSeries.$inferInsert;
