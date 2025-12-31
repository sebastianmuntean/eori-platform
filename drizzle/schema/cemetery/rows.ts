import { pgTable, uuid, varchar, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { cemeteries } from "./cemeteries";
import { cemeteryParcels } from "./parcels";

/**
 * Cemetery Rows table (Rânduri)
 * Rows within a parcel
 */
export const cemeteryRows = pgTable("cemetery_rows", {
  id: uuid("id").defaultRandom().primaryKey(),
  parcelId: uuid("parcel_id").notNull().references(() => cemeteryParcels.id, { onDelete: "cascade" }),
  cemeteryId: uuid("cemetery_id").notNull().references(() => cemeteries.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  code: varchar("code", { length: 20 }).notNull(), // R-01
  name: varchar("name", { length: 255 }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParcelCode: unique("cemetery_rows_parcel_code_unique").on(table.parcelId, table.code),
  idxParcel: index("idx_cemetery_rows_parcel").on(table.parcelId),
  idxCemetery: index("idx_cemetery_rows_cemetery").on(table.cemeteryId),
  idxParish: index("idx_cemetery_rows_parish").on(table.parishId),
}));

export type CemeteryRow = typeof cemeteryRows.$inferSelect;
export type NewCemeteryRow = typeof cemeteryRows.$inferInsert;
