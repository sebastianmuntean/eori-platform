import { pgTable, uuid, varchar, text, timestamp, decimal, date, integer, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { partners } from "../core/partners";
import { users } from "../auth/users";

/**
 * Invoice direction enum
 */
export const invoiceDirectionEnum = pgEnum("invoice_direction", ["in", "out"]);

/**
 * Invoice status enum
 */
export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "issued",
  "sent",
  "paid",
  "partial",
  "cancelled",
  "overdue"
]);

/**
 * Invoices table
 * Invoice management (both incoming and outgoing)
 */
export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Direction and type
  direction: invoiceDirectionEnum("direction").notNull(), // in = received, out = issued
  
  // Numbering
  series: varchar("series", { length: 20 }).notNull(),
  number: integer("number").notNull(),
  
  // Dates
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  
  // Partner
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "restrict" }),
  
  // Values
  subtotal: decimal("subtotal", { precision: 15, scale: 2 }).notNull(),
  vatAmount: decimal("vat_amount", { precision: 15, scale: 2 }).default("0"),
  total: decimal("total", { precision: 15, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RON"),
  
  // Payments
  paidAmount: decimal("paid_amount", { precision: 15, scale: 2 }).default("0"),
  remainingAmount: decimal("remaining_amount", { precision: 15, scale: 2 }),
  
  status: invoiceStatusEnum("status").default("draft"),
  
  notes: text("notes"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  uniqueParishSeriesNumber: unique("invoices_parish_series_number_unique").on(
    table.parishId,
    table.series,
    table.number,
    table.direction
  ),
  idxParishDate: index("idx_invoices_parish_date").on(table.parishId, table.issueDate),
  idxParishStatus: index("idx_invoices_parish_status").on(table.parishId, table.status),
  idxParishDue: index("idx_invoices_parish_due").on(table.parishId, table.dueDate),
  idxPartner: index("idx_invoices_partner").on(table.partnerId),
  idxDirection: index("idx_invoices_direction").on(table.parishId, table.direction),
}));

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
