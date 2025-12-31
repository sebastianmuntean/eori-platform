import { pgTable, uuid, varchar, decimal, integer, index } from "drizzle-orm/pg-core";
import { invoices } from "./invoices";
import { accounts } from "./accounts";

/**
 * Invoice Items table
 * Line items for invoices
 */
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  
  // Product/Service
  productId: uuid("product_id"), // Reference to products table (optional)
  description: varchar("description", { length: 500 }).notNull(),
  
  // Quantity and price
  quantity: decimal("quantity", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 20 }).default("buc"),
  unitPrice: decimal("unit_price", { precision: 15, scale: 2 }).notNull(),
  
  // VAT
  vatRate: decimal("vat_rate", { precision: 5, scale: 2 }).default("19"),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }),
  
  // Totals
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  
  // Accounting
  accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
  
  sortOrder: integer("sort_order").default(0),
}, (table) => ({
  idxInvoice: index("idx_invoice_items_invoice").on(table.invoiceId),
  idxProduct: index("idx_invoice_items_product").on(table.productId),
}));

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type NewInvoiceItem = typeof invoiceItems.$inferInsert;
