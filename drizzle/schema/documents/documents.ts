import { pgTable, uuid, varchar, text, boolean, timestamp, integer, date, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { partners } from "../core/partners";
import { users } from "../auth/users";

/**
 * Document direction enum
 */
export const documentDirectionEnum = pgEnum("document_direction", ["in", "out"]);

/**
 * Document status enum
 */
export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "registered",
  "distributed",
  "processing",
  "completed",
  "archived"
]);

/**
 * Document priority enum
 */
export const documentPriorityEnum = pgEnum("document_priority", ["low", "normal", "high", "urgent"]);

/**
 * Documents table (Registratură)
 * Official correspondence management (inbound/outbound)
 */
export const documents = pgTable("documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Numbering
  direction: documentDirectionEnum("direction").notNull(), // 'in' or 'out'
  registrationNumber: integer("registration_number").notNull(), // Auto-generated number
  registrationYear: integer("registration_year").notNull(),
  registrationDate: date("registration_date").notNull(),
  
  // Formatted number (calculated): "102/01.01.2024"
  formattedNumber: varchar("formatted_number", { length: 50 }).notNull(),
  
  // For INCOMING documents
  senderPartnerId: uuid("sender_partner_id").references(() => partners.id),
  senderName: varchar("sender_name", { length: 255 }), // If not an existing partner
  senderDocNumber: varchar("sender_doc_number", { length: 100 }),
  senderDocDate: date("sender_doc_date"),
  
  // For OUTGOING documents
  recipientPartnerId: uuid("recipient_partner_id").references(() => partners.id),
  recipientName: varchar("recipient_name", { length: 255 }),
  
  // Content
  subject: varchar("subject", { length: 500 }).notNull(),
  content: text("content"),
  
  // Classification
  status: documentStatusEnum("status").default("draft"),
  priority: documentPriorityEnum("priority").default("normal"),
  department: varchar("department", { length: 100 }), // Compartiment
  fileIndex: varchar("file_index", { length: 50 }), // Indicativ dosar
  
  // Relations
  parentDocumentId: uuid("parent_document_id"), // Response to (self-reference)
  
  // Deadline
  dueDate: date("due_date"),
  completedDate: date("completed_date"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  // Unique number per parish/year/direction
  uniqueNumber: unique("documents_parish_year_direction_number_unique").on(
    table.parishId,
    table.registrationYear,
    table.direction,
    table.registrationNumber
  ),
  
  // Performance indexes
  idxParishDate: index("idx_documents_parish_date").on(table.parishId, table.registrationDate),
  idxParishYear: index("idx_documents_parish_year").on(table.parishId, table.registrationYear),
  idxParishStatus: index("idx_documents_parish_status").on(table.parishId, table.status),
  idxParishDirection: index("idx_documents_parish_direction").on(table.parishId, table.direction),
  idxDueDate: index("idx_documents_due_date").on(table.parishId, table.dueDate),
  idxParent: index("idx_documents_parent").on(table.parentDocumentId),
}));

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
