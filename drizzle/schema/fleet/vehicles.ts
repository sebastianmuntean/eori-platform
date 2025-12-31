import { pgTable, uuid, varchar, text, boolean, integer, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Vehicles table
 * Fleet management - vehicles owned by parishes
 */
export const vehicles = pgTable("vehicles", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  licensePlate: varchar("license_plate", { length: 20 }).notNull(),
  brand: varchar("brand", { length: 100 }),
  model: varchar("model", { length: 100 }),
  category: varchar("category", { length: 50 }),
  bodyType: varchar("body_type", { length: 50 }),
  manufactureYear: integer("manufacture_year"),
  acquisitionYear: integer("acquisition_year"),
  vin: varchar("vin", { length: 50 }),
  engineNumber: varchar("engine_number", { length: 50 }),
  engineCapacity: integer("engine_capacity"), // cc
  powerKw: integer("power_kw"),
  fuelType: varchar("fuel_type", { length: 20 }),
  color: varchar("color", { length: 50 }),
  currentMileage: integer("current_mileage"),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishPlate: unique("vehicles_parish_plate_unique").on(table.parishId, table.licensePlate),
  idxParish: index("idx_vehicles_parish").on(table.parishId),
  idxActive: index("idx_vehicles_active").on(table.parishId, table.isActive),
  idxVin: index("idx_vehicles_vin").on(table.vin),
}));

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;
