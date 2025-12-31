import { pgTable, uuid, varchar, text, decimal, date, timestamp, integer, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { vehicles } from "./vehicles";
import { users } from "../auth/users";

/**
 * Vehicle Repairs table (Reparații)
 */
export const vehicleRepairs = pgTable("vehicle_repairs", {
  id: uuid("id").defaultRandom().primaryKey(),
  vehicleId: uuid("vehicle_id").notNull().references(() => vehicles.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  repairDate: date("repair_date").notNull(),
  repairType: varchar("repair_type", { length: 100 }),
  mileage: integer("mileage"),
  durationHours: decimal("duration_hours", { precision: 5, scale: 2 }),
  description: text("description"),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  partsCost: decimal("parts_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  company: varchar("company", { length: 255 }),
  rating: varchar("rating", { length: 50 }), // excellent, good, satisfactory, poor
  documentType: varchar("document_type", { length: 50 }),
  documentNumber: varchar("document_number", { length: 100 }),
  documentDate: date("document_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").references(() => users.id),
}, (table) => ({
  idxVehicle: index("idx_vehicle_repairs_vehicle").on(table.vehicleId),
  idxParish: index("idx_vehicle_repairs_parish").on(table.parishId),
  idxDate: index("idx_vehicle_repairs_date").on(table.parishId, table.repairDate),
  idxType: index("idx_vehicle_repairs_type").on(table.repairType),
}));

export type VehicleRepair = typeof vehicleRepairs.$inferSelect;
export type NewVehicleRepair = typeof vehicleRepairs.$inferInsert;
