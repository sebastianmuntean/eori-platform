import { pgTable, uuid, varchar, text, decimal, date, integer, timestamp, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Asset status enum
 */
export const assetStatusEnum = pgEnum("asset_status", ["active", "inactive", "disposed", "damaged"]);

/**
 * Fixed Assets table (Mijloace Fixe)
 * Buildings, land, vehicles, equipment, furniture, cultural items
 */
export const fixedAssets = pgTable("fixed_assets", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  inventoryNumber: varchar("inventory_number", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }), // building, land, vehicle, equipment, furniture, cultural
  type: varchar("type", { length: 100 }),
  location: varchar("location", { length: 255 }),
  acquisitionDate: date("acquisition_date"),
  acquisitionValue: decimal("acquisition_value", { precision: 15, scale: 2 }),
  currentValue: decimal("current_value", { precision: 15, scale: 2 }),
  depreciationMethod: varchar("depreciation_method", { length: 20 }),
  usefulLifeYears: integer("useful_life_years"),
  status: assetStatusEnum("status").default("active"),
  disposalDate: date("disposal_date"),
  disposalValue: decimal("disposal_value", { precision: 15, scale: 2 }),
  disposalReason: text("disposal_reason"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishInventory: unique("fixed_assets_parish_inventory_unique").on(table.parishId, table.inventoryNumber),
  idxParish: index("idx_fixed_assets_parish").on(table.parishId),
  idxCategory: index("idx_fixed_assets_category").on(table.parishId, table.category),
  idxStatus: index("idx_fixed_assets_status").on(table.parishId, table.status),
  idxLocation: index("idx_fixed_assets_location").on(table.location),
}));

export type FixedAsset = typeof fixedAssets.$inferSelect;
export type NewFixedAsset = typeof fixedAssets.$inferInsert;
