import { pgTable, uuid, timestamp, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { roles } from "./roles";

/**
 * User Roles table (many-to-many)
 * Links users to their roles
 */
export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserRole: unique("user_roles_unique").on(table.userId, table.roleId),
  idxUser: index("idx_user_roles_user").on(table.userId),
  idxRole: index("idx_user_roles_role").on(table.roleId),
}));

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;
