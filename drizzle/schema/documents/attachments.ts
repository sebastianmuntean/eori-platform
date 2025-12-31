import { pgTable, uuid, varchar, text, integer, timestamp, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { users } from "../auth/users";

/**
 * Attachments table (Polymorphic)
 * Generic attachments table used by multiple modules (documents, invoices, contracts, etc.)
 */
export const attachments = pgTable("attachments", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Polymorphic reference
  entityType: varchar("entity_type", { length: 50 }).notNull(), // 'document', 'invoice', 'contract'
  entityId: uuid("entity_id").notNull(),
  
  // File info
  fileName: varchar("file_name", { length: 255 }).notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  fileSize: integer("file_size").notNull(), // bytes
  storageKey: varchar("storage_key", { length: 500 }).notNull(), // S3/R2 key
  
  // Metadata
  description: text("description"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull(),
  uploadedBy: uuid("uploaded_by").notNull().references(() => users.id),
}, (table) => ({
  idxEntity: index("idx_attachments_entity").on(table.entityType, table.entityId),
  idxParish: index("idx_attachments_parish").on(table.parishId),
}));

export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
