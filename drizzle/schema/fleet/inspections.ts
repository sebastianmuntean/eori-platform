import { pgTable, uuid, varchar, decimal, date, timestamp, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { vehicles } from "./vehicles";

/**
 * Vehicle Inspections table (ITP - Inspecții Tehnice Periodice)
 */
export const vehicleInspections = pgTable("vehicle_inspections", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  inspectionDate: date("inspection_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  result: varchar("result", { length: 50 }), // passed, failed, conditional
  company: varchar("company", { length: 255 }),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  documentNumber: varchar("document_number", { length: 100 }),
  notes: varchar("notes", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxVehicle: index("idx_vehicle_inspections_vehicle").on(table.vehicleId),
  idxParish: index("idx_vehicle_inspections_parish").on(table.parishId),
  idxExpiryDate: index("idx_vehicle_inspections_expiry").on(table.parishId, table.expiryDate),
}));

export type VehicleInspection = typeof vehicleInspections.$inferSelect;
export type NewVehicleInspection = typeof vehicleInspections.$inferInsert;
