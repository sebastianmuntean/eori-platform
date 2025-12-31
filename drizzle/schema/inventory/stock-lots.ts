import { pgTable, uuid, varchar, timestamp, decimal, date, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { warehouses } from "./warehouses";
import { products } from "./products";

/**
 * Stock Lots table
 * Tracks individual lots for FIFO/LIFO inventory management
 */
export const stockLots = pgTable("stock_lots", {
  id: uuid("id").defaultRandom().primaryKey(),
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Lot identification
  lotNumber: varchar("lot_number", { length: 50 }),
  expiryDate: date("expiry_date"),
  
  // Quantity and value
  initialQuantity: decimal("initial_quantity", { precision: 10, scale: 3 }).notNull(),
  currentQuantity: decimal("current_quantity", { precision: 10, scale: 3 }).notNull(),
  unitCost: decimal("unit_cost", { precision: 15, scale: 4 }).notNull(),
  
  // Reference to receipt movement
  movementId: uuid("movement_id"),
  
  receivedDate: date("received_date").notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxWarehouseProduct: index("idx_stock_lots_wh_product").on(table.warehouseId, table.productId),
  idxParish: index("idx_stock_lots_parish").on(table.parishId),
  idxReceived: index("idx_stock_lots_received").on(table.warehouseId, table.productId, table.receivedDate),
  idxExpiry: index("idx_stock_lots_expiry").on(table.parishId, table.expiryDate),
  idxCurrentQty: index("idx_stock_lots_current_qty").on(table.warehouseId, table.productId, table.currentQuantity),
}));

export type StockLot = typeof stockLots.$inferSelect;
export type NewStockLot = typeof stockLots.$inferInsert;
