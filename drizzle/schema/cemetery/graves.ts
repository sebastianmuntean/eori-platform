import { pgTable, uuid, varchar, text, timestamp, integer, decimal, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { cemeteries } from "./cemeteries";
import { cemeteryParcels } from "./parcels";
import { cemeteryRows } from "./rows";

/**
 * Grave status enum
 */
export const graveStatusEnum = pgEnum("grave_status", ["free", "occupied", "reserved", "maintenance"]);

/**
 * Cemetery Graves table (Locuri de veci)
 * Individual burial plots
 */
export const cemeteryGraves = pgTable("cemetery_graves", {
  id: uuid("id").defaultRandom().primaryKey(),
  rowId: uuid("row_id").notNull().references(() => cemeteryRows.id, { onDelete: "cascade" }),
  parcelId: uuid("parcel_id").notNull().references(() => cemeteryParcels.id, { onDelete: "cascade" }),
  cemeteryId: uuid("cemetery_id").notNull().references(() => cemeteries.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  code: varchar("code", { length: 20 }).notNull(), // L-01
  status: graveStatusEnum("status").default("free"),
  
  // Dimensions
  width: decimal("width", { precision: 5, scale: 2 }), // meters
  length: decimal("length", { precision: 5, scale: 2 }),
  
  // Position in cemetery (for map visualization)
  positionX: integer("position_x"),
  positionY: integer("position_y"),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueRowCode: unique("cemetery_graves_row_code_unique").on(table.rowId, table.code),
  idxRow: index("idx_cemetery_graves_row").on(table.rowId),
  idxCemetery: index("idx_cemetery_graves_cemetery").on(table.cemeteryId),
  idxParish: index("idx_cemetery_graves_parish").on(table.parishId),
  idxStatus: index("idx_cemetery_graves_status").on(table.parishId, table.status),
}));

export type CemeteryGrave = typeof cemeteryGraves.$inferSelect;
export type NewCemeteryGrave = typeof cemeteryGraves.$inferInsert;
