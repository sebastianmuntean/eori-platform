import { pgTable, uuid, decimal, index } from "drizzle-orm/pg-core";
import { sales } from "./sales";
import { products } from "./products";
import { stockMovements } from "./stock-movements";

/**
 * Sale Items table
 * Line items for sales
 */
export const saleItems = pgTable("sale_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  productId: uuid("product_id").notNull().references(() => products.id, { onDelete: "restrict" }),
  
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }),
  
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  
  // Link to stock movement
  movementId: uuid("movement_id").references(() => stockMovements.id, { onDelete: "set null" }),
}, (table) => ({
  idxSale: index("idx_sale_items_sale").on(table.saleId),
  idxProduct: index("idx_sale_items_product").on(table.productId),
}));

export type SaleItem = typeof saleItems.$inferSelect;
export type NewSaleItem = typeof saleItems.$inferInsert;
