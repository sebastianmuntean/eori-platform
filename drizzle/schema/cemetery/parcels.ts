import { pgTable, uuid, varchar, text, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { cemeteries } from "./cemeteries";

/**
 * Cemetery Parcels table (Parcele)
 * Division of cemetery into sections
 */
export const cemeteryParcels = pgTable("cemetery_parcels", {
  id: uuid("id").defaultRandom().primaryKey(),
  cemeteryId: uuid("cemetery_id").notNull().references(() => cemeteries.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  code: varchar("code", { length: 20 }).notNull(), // P-01
  name: varchar("name", { length: 255 }),
  description: text("description"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueCemeteryCode: unique("cemetery_parcels_cemetery_code_unique").on(table.cemeteryId, table.code),
  idxCemetery: index("idx_cemetery_parcels_cemetery").on(table.cemeteryId),
  idxParish: index("idx_cemetery_parcels_parish").on(table.parishId),
}));

export type CemeteryParcel = typeof cemeteryParcels.$inferSelect;
export type NewCemeteryParcel = typeof cemeteryParcels.$inferInsert;
