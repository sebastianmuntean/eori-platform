import { pgTable, uuid, varchar, decimal, date, timestamp, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { vehicles } from "./vehicles";

/**
 * Vehicle Insurances table (Asigurări)
 */
export const vehicleInsurances = pgTable("vehicle_insurances", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  insuranceType: varchar("insurance_type", { length: 50 }).notNull(), // RCA, CASCO
  company: varchar("company", { length: 255 }),
  policyNumber: varchar("policy_number", { length: 100 }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }),
  documentNumber: varchar("document_number", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxVehicle: index("idx_vehicle_insurances_vehicle").on(table.vehicleId),
  idxParish: index("idx_vehicle_insurances_parish").on(table.parishId),
  idxEndDate: index("idx_vehicle_insurances_end").on(table.parishId, table.endDate),
  idxType: index("idx_vehicle_insurances_type").on(table.parishId, table.insuranceType),
}));

export type VehicleInsurance = typeof vehicleInsurances.$inferSelect;
export type NewVehicleInsurance = typeof vehicleInsurances.$inferInsert;
