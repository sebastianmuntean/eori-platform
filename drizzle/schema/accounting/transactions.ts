import { pgTable, uuid, varchar, text, timestamp, decimal, date, index, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { partners } from "../core/partners";
import { users } from "../auth/users";
import { accounts } from "./accounts";

/**
 * Transaction type enum
 */
export const transactionTypeEnum = pgEnum("transaction_type", ["receipt", "payment", "transfer"]);

/**
 * Transaction method enum
 */
export const transactionMethodEnum = pgEnum("transaction_method", ["cash", "bank", "card", "other"]);

/**
 * Transactions table
 * Financial transactions (receipts and payments)
 */
export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Type and date
  type: transactionTypeEnum("type").notNull(),
  method: transactionMethodEnum("method").notNull(),
  transactionDate: date("transaction_date").notNull(),
  
  // Value
  amount: decimal("amount", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RON"),
  
  // Account
  accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "restrict" }),
  accountCode: varchar("account_code", { length: 20 }).notNull(), // Denormalized for performance
  
  // Partner (optional)
  partnerId: uuid("partner_id").references(() => partners.id, { onDelete: "set null" }),
  
  // Supporting document
  documentType: varchar("document_type", { length: 50 }), // receipt, invoice, voucher
  documentSeries: varchar("document_series", { length: 20 }),
  documentNumber: varchar("document_number", { length: 50 }),
  documentDate: date("document_date"),
  
  // Description
  description: text("description"),
  
  // References (for cross-module links)
  sourceType: varchar("source_type", { length: 50 }), // concession_payment, sale, invoice
  sourceId: uuid("source_id"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  idxParishDate: index("idx_transactions_parish_date").on(table.parishId, table.transactionDate),
  idxParishAccount: index("idx_transactions_parish_account").on(table.parishId, table.accountId),
  idxParishType: index("idx_transactions_parish_type").on(table.parishId, table.type),
  idxSource: index("idx_transactions_source").on(table.sourceType, table.sourceId),
  idxPartner: index("idx_transactions_partner").on(table.partnerId),
}));

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
