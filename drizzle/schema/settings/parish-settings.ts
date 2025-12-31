import { pgTable, uuid, varchar, integer, decimal, timestamp } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { accounts } from "../accounting/accounts";
import { users } from "../auth/users";

/**
 * Parish Settings table
 * Configuration settings per parish
 */
export const parishSettings = pgTable("parish_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }).unique(),
  
  // Document numbering
  documentNumberFormat: varchar("document_number_format", { length: 100 }).default("{number}/{date}"),
  documentDateFormat: varchar("document_date_format", { length: 20 }).default("DD.MM.YYYY"),
  
  // Prefixes and series
  receiptSeriesPrefix: varchar("receipt_series_prefix", { length: 10 }),
  invoiceSeriesPrefix: varchar("invoice_series_prefix", { length: 10 }),
  
  // Alerts
  concessionExpiryWarningDays: integer("concession_expiry_warning_days").default(30),
  insuranceExpiryWarningDays: integer("insurance_expiry_warning_days").default(30),
  bookDueWarningDays: integer("book_due_warning_days").default(3),
  lowStockWarningThreshold: decimal("low_stock_warning_threshold", { precision: 10, scale: 2 }).default("5"),
  
  // Accounting
  defaultIncomeAccountId: uuid("default_income_account_id").references(() => accounts.id, { onDelete: "set null" }),
  defaultExpenseAccountId: uuid("default_expense_account_id").references(() => accounts.id, { onDelete: "set null" }),
  defaultVatRate: decimal("default_vat_rate", { precision: 5, scale: 2 }).default("19"),
  
  // Other settings
  currency: varchar("currency", { length: 3 }).default("RON"),
  timezone: varchar("timezone", { length: 50 }).default("Europe/Bucharest"),
  
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export type ParishSetting = typeof parishSettings.$inferSelect;
export type NewParishSetting = typeof parishSettings.$inferInsert;
