import { pgTable, uuid, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { permissions } from "./permissions";

/**
 * User Permission Overrides table
 * Allows granting or denying specific permissions to individual users
 * (overrides role-based permissions)
 */
export const userPermissionOverrides = pgTable("user_permission_overrides", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  granted: boolean("granted").notNull(), // true = grant explicit, false = deny explicit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserPermission: unique("user_permission_overrides_unique").on(table.userId, table.permissionId),
  idxUser: index("idx_user_permission_overrides_user").on(table.userId),
  idxPermission: index("idx_user_permission_overrides_permission").on(table.permissionId),
}));

export type UserPermissionOverride = typeof userPermissionOverrides.$inferSelect;
export type NewUserPermissionOverride = typeof userPermissionOverrides.$inferInsert;
