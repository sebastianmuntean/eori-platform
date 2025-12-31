import { pgTable, uuid, varchar, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { users } from "../auth/users";

/**
 * Activity Log table
 * Audit trail for all important operations
 */
export const activityLog = pgTable("activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").references(() => parishes.id, { onDelete: "set null" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  
  // Action
  action: varchar("action", { length: 50 }).notNull(), // create, update, delete, view, export
  entityType: varchar("entity_type", { length: 100 }).notNull(), // document, concession, transaction
  entityId: uuid("entity_id"),
  
  // Details
  description: text("description"),
  oldValues: jsonb("old_values"), // Values before modification
  newValues: jsonb("new_values"), // Values after modification
  
  // Context
  ipAddress: varchar("ip_address", { length: 50 }),
  userAgent: text("user_agent"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxParish: index("idx_activity_log_parish").on(table.parishId),
  idxUser: index("idx_activity_log_user").on(table.userId),
  idxEntity: index("idx_activity_log_entity").on(table.entityType, table.entityId),
  idxCreated: index("idx_activity_log_created").on(table.parishId, table.createdAt),
  idxAction: index("idx_activity_log_action").on(table.action),
}));

export type ActivityLogEntry = typeof activityLog.$inferSelect;
export type NewActivityLogEntry = typeof activityLog.$inferInsert;
