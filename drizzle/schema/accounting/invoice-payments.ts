import { pgTable, uuid, decimal, date, timestamp, index } from "drizzle-orm/pg-core";
import { invoices } from "./invoices";
import { transactions } from "./transactions";

/**
 * Invoice Payments table
 * Tracks partial payments for invoices
 */
export const invoicePayments = pgTable("invoice_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  transactionId: uuid("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  paymentDate: date("payment_date").notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxInvoice: index("idx_invoice_payments_invoice").on(table.invoiceId),
  idxTransaction: index("idx_invoice_payments_transaction").on(table.transactionId),
}));

export type InvoicePayment = typeof invoicePayments.$inferSelect;
export type NewInvoicePayment = typeof invoicePayments.$inferInsert;
