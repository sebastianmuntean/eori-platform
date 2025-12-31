import { pgTable, uuid, text, timestamp, date, index, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { partners } from "../core/partners";
import { users } from "../auth/users";
import { libraryBooks } from "./books";

/**
 * Loan status enum
 */
export const loanStatusEnum = pgEnum("loan_status", ["active", "returned", "overdue", "lost"]);

/**
 * Library Loans table (Împrumuturi)
 */
export const libraryLoans = pgTable("library_loans", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  bookId: uuid("book_id").notNull().references(() => libraryBooks.id, { onDelete: "restrict" }),
  borrowerPartnerId: uuid("borrower_partner_id").notNull().references(() => partners.id, { onDelete: "restrict" }),
  loanDate: date("loan_date").notNull(),
  dueDate: date("due_date").notNull(),
  returnDate: date("return_date"),
  status: loanStatusEnum("status").default("active"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
}, (table) => ({
  idxParish: index("idx_library_loans_parish").on(table.parishId),
  idxBook: index("idx_library_loans_book").on(table.bookId),
  idxBorrower: index("idx_library_loans_borrower").on(table.borrowerPartnerId),
  idxStatus: index("idx_library_loans_status").on(table.parishId, table.status),
  idxDue: index("idx_library_loans_due").on(table.parishId, table.dueDate),
}));

export type LibraryLoan = typeof libraryLoans.$inferSelect;
export type NewLibraryLoan = typeof libraryLoans.$inferInsert;
