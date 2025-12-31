import { pgTable, uuid, varchar, text, boolean, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { users } from "../auth/users";

/**
 * Notification type enum
 */
export const notificationTypeEnum = pgEnum("notification_type", [
  "concession_expiry",
  "insurance_expiry",
  "itp_expiry",
  "book_overdue",
  "document_pending",
  "invoice_overdue",
  "low_stock",
  "leave_request",
  "system"
]);

/**
 * Notifications table
 * System notifications and alerts
 */
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }), // NULL = notification for all
  
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  
  // Link to entity
  entityType: varchar("entity_type", { length: 100 }),
  entityId: uuid("entity_id"),
  actionUrl: varchar("action_url", { length: 500 }),
  
  // Status
  isRead: boolean("is_read").default(false),
  readAt: timestamp("read_at", { withTimezone: true }),
  
  // Scheduling
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxParishUser: index("idx_notifications_parish_user").on(table.parishId, table.userId),
  idxUnread: index("idx_notifications_unread").on(table.parishId, table.userId, table.isRead),
  idxScheduled: index("idx_notifications_scheduled").on(table.scheduledFor),
  idxType: index("idx_notifications_type").on(table.parishId, table.type),
}));

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
