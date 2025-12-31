import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { accounts } from "../accounting/accounts";

/**
 * Product category enum
 */
export const productCategoryEnum = pgEnum("product_category", [
  "pangar",    // Church shop products (candles, religious items)
  "material",  // Materials (construction, maintenance)
  "service",   // Services
  "fixed",     // Fixed assets
  "other"
]);

/**
 * Products table
 * Product/service catalog
 */
export const products = pgTable("products", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").references(() => parishes.id, { onDelete: "cascade" }), // NULL = global product
  
  code: varchar("code", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  category: productCategoryEnum("category").default("other"),
  unit: varchar("unit", { length: 20 }).notNull().default("buc"), // buc, kg, L, m
  
  // Standard prices
  purchasePrice: decimal("purchase_price", { precision: 15, scale: 2 }),
  salePrice: decimal("sale_price", { precision: 15, scale: 2 }),
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("19"),
  
  // Accounting links
  expenseAccountId: uuid("expense_account_id").references(() => accounts.id, { onDelete: "set null" }),
  incomeAccountId: uuid("income_account_id").references(() => accounts.id, { onDelete: "set null" }),
  stockAccountId: uuid("stock_account_id").references(() => accounts.id, { onDelete: "set null" }),
  
  // Minimum stock for alert
  minStock: decimal("min_stock", { precision: 10, scale: 3 }),
  
  barcode: varchar("barcode", { length: 100 }),
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("products_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_products_parish").on(table.parishId),
  idxCategory: index("idx_products_category").on(table.category),
  idxActive: index("idx_products_active").on(table.parishId, table.isActive),
  idxBarcode: index("idx_products_barcode").on(table.barcode),
}));

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
