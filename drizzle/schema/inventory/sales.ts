import { pgTable, uuid, varchar, text, boolean, timestamp, decimal, date, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { partners } from "../core/partners";
import { users } from "../auth/users";
import { warehouses } from "./warehouses";
import { transactions } from "../accounting/transactions";
import { transactionMethodEnum } from "../accounting/transactions";

/**
 * Sales table (Vânzări pangar)
 * Sales transactions, particularly for church shop (pangar)
 */
export const sales = pgTable("sales", {
  id: uuid("id").defaultRandom().primaryKey(),
  warehouseId: uuid("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  saleDate: date("sale_date").notNull(),
  saleNumber: varchar("sale_number", { length: 50 }),
  
  // Customer (optional for pangar sales)
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  
  // Totals
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }).default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  
  // Payment
  paymentMethod: transactionMethodEnum("payment_method").default("cash"),
  isPaid: boolean("is_paid").default(true),
  
  // Link to transaction
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
}, (table) => ({
  idxParishDate: index("idx_sales_parish_date").on(table.parishId, table.saleDate),
  idxWarehouse: index("idx_sales_warehouse").on(table.warehouseId),
  idxPartner: index("idx_sales_partner").on(table.partnerId),
}));

export type Sale = typeof sales.$inferSelect;
export type NewSale = typeof sales.$inferInsert;
