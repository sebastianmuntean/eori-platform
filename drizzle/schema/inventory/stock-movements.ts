import { pgTable, uuid, varchar, text, timestamp, decimal, date, index, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { partners } from "../core/partners";
import { users } from "../auth/users";
import { warehouses } from "./warehouses";
import { products } from "./products";
import { stockLots } from "./stock-lots";

/**
 * Movement type enum
 */
export const movementTypeEnum = pgEnum("movement_type", [
  "receipt",     // Incoming (reception)
  "issue",       // Outgoing (consumption)
  "transfer_in", // Transfer incoming
  "transfer_out",// Transfer outgoing
  "adjustment",  // Inventory adjustment
  "sale",        // Sale
  "return"       // Return
]);

/**
 * Stock Movements table
 * Tracks all inventory movements
 */
export const stockMovements = pgTable("stock_movements", {
  id: uuid("id").defaultRandom().primaryKey(),
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  type: movementTypeEnum("type").notNull(),
  movementDate: date("movement_date").notNull(),
  
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(), // + or -
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }),
  totalValue: decimal("total_value", { precision: 15, scale: 2 }),
  
  // Document
  documentType: varchar("document_type", { length: 50 }), // invoice, voucher, transfer_note
  documentNumber: varchar("document_number", { length: 50 }),
  documentDate: date("document_date"),
  
  // Partner (supplier/customer)
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  
  // Transfer between warehouses
  destinationWarehouseId: uuid("destination_warehouse_id").references(() => warehouses.id, { onDelete: "set null" }),
  relatedMovementId: uuid("related_movement_id"), // Corresponding movement for transfer
  
  // Lot used (for FIFO/LIFO outgoing)
  lotId: uuid("lot_id").references(() => stockLots.id, { onDelete: "set null" }),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
}, (table) => ({
  idxWarehouseProduct: index("idx_stock_movements_wh_product").on(table.warehouseId, table.productId),
  idxParishDate: index("idx_stock_movements_parish_date").on(table.parishId, table.movementDate),
  idxType: index("idx_stock_movements_type").on(table.parishId, table.type),
  idxPartner: index("idx_stock_movements_partner").on(table.partnerId),
  idxLot: index("idx_stock_movements_lot").on(table.lotId),
}));

export type StockMovement = typeof stockMovements.$inferSelect;
export type NewStockMovement = typeof stockMovements.$inferInsert;
