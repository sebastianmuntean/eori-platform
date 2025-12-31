import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

// Roles table
export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Permissions table
export const permissions = pgTable("permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  resource: varchar("resource", { length: 100 }).notNull(),
  action: varchar("action", { length: 50 }).notNull(),
  name: varchar("name", { length: 255 }).notNull().unique(),
  displayName: varchar("display_name", { length: 255 }).notNull(),
  description: text("description"),
  isSystem: boolean("is_system").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Role permissions (many-to-many)
export const rolePermissions = pgTable("role_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// User roles (many-to-many)
export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// User permission overrides
export const userPermissionOverrides = pgTable("user_permission_overrides", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  permissionId: uuid("permission_id")
    .notNull()
    .references(() => permissions.id, { onDelete: "cascade" }),
  granted: boolean("granted").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// User resource access (record-level access control)
export const userResourceAccess = pgTable("user_resource_access", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  resourceType: varchar("resource_type", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 255 }).notNull(),
  granted: boolean("granted").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});




