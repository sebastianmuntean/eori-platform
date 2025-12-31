import { pgTable, uuid, timestamp, index, unique } from "drizzle-orm/pg-core";
import { roles } from "./roles";
import { permissions } from "./permissions";

/**
 * Role Permissions table (many-to-many)
 * Links roles to their permissions
 */
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueRolePermission: unique("role_permissions_unique").on(table.roleId, table.permissionId),
  idxRole: index("idx_role_permissions_role").on(table.roleId),
  idxPermission: index("idx_role_permissions_permission").on(table.permissionId),
}));

export type RolePermission = typeof rolePermissions.$inferSelect;
export type NewRolePermission = typeof rolePermissions.$inferInsert;
