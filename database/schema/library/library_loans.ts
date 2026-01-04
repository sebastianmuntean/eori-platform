import { pgTable, uuid, date, text, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { libraryBooks } from './library_books';
import { clients } from '../clients/clients';
import { users } from '../superadmin/users';

export const loanStatusEnum = pgEnum('loan_status', ['active', 'returned', 'overdue', 'lost']);

export const libraryLoans = pgTable('library_loans', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id),
  bookId: uuid('book_id').notNull().references(() => libraryBooks.id),
  borrowerClientId: uuid('borrower_client_id').notNull().references(() => clients.id),
  loanDate: date('loan_date').notNull(),
  dueDate: date('due_date').notNull(),
  returnDate: date('return_date'),
  status: loanStatusEnum('status').default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
});




