import { pgTable, uuid, varchar, text, timestamp, decimal, date, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { users } from "../auth/users";
import { concessions } from "./concessions";

/**
 * Concession Payments table
 * Payment records for concession fees
 */
export const concessionPayments = pgTable("concession_payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  concessionId: uuid("concession_id").notNull().references(() => concessions.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Payment
  paymentDate: date("payment_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RON"),
  
  // Period covered
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  
  // Receipt document
  receiptNumber: varchar("receipt_number", { length: 50 }),
  receiptDate: date("receipt_date"),
  
  // Link to accounting transaction
  transactionId: uuid("transaction_id"),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
}, (table) => ({
  idxConcession: index("idx_concession_payments_concession").on(table.concessionId),
  idxParish: index("idx_concession_payments_parish").on(table.parishId),
  idxParishDate: index("idx_concession_payments_parish_date").on(table.parishId, table.paymentDate),
}));

export type ConcessionPayment = typeof concessionPayments.$inferSelect;
export type NewConcessionPayment = typeof concessionPayments.$inferInsert;
