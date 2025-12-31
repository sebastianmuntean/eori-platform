import { pgTable, uuid, varchar, text, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";

/**
 * Permissions table
 * Granular permissions for resources and actions
 */
export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  resource: varchar("resource", { length: 100 }).notNull(), // documents, cemetery, accounting
  action: varchar("action", { length: 50 }).notNull(), // create, read, update, delete, approve, export
  name: varchar("name", { length: 255 }).notNull().unique(), // documents.read, cemetery.create
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueResourceAction: unique("permissions_resource_action_unique").on(table.resource, table.action),
  idxResource: index("idx_permissions_resource").on(table.resource),
  idxName: index("idx_permissions_name").on(table.name),
}));

export type Permission = typeof permissions.$inferSelect;
export type NewPermission = typeof permissions.$inferInsert;
