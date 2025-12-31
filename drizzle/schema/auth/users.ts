import { pgTable, uuid, varchar, text, boolean, timestamp, index, pgEnum } from "drizzle-orm/pg-core";

/**
 * User role enum (legacy - for backward compatibility)
 */
export const userRoleEnum = pgEnum("user_role", [
  "episcop",
  "vicar",
  "paroh",
  "secretar",
  "contabil",
]);

/**
 * Approval status enum
 */
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

/**
 * Users table
 * Core authentication and user management
 */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  
  // Legacy role (for migration compatibility)
  role: userRoleEnum("role"),
  
  // 2FA
  twoFactorEnabled: boolean("two_factor_enabled").default(false),
  twoFactorSecret: varchar("two_factor_secret", { length: 255 }),
  
  // Status
  isActive: boolean("is_active").default(true),
  approvalStatus: approvalStatusEnum("approval_status").notNull().default("pending"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedBy: uuid("approved_by"),
  adminNotes: text("admin_notes"),
  
  // Password reset
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  
  // Email verification
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationCodeExpiry: timestamp("verification_code_expiry", { withTimezone: true }),
  
  // Preferences
  preferredLanguage: varchar("preferred_language", { length: 10 }).default("ro"),
  timezone: varchar("timezone", { length: 50 }).default("Europe/Bucharest"),
  
  // Legacy (for migration)
  legacyRole: varchar("legacy_role", { length: 50 }),
  legacyParishId: uuid("legacy_parish_id"), // Old parohie_id
  legacyPermissions: text("legacy_permissions").array().default([]),
  
  // Audit
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  idxEmail: index("idx_users_email").on(table.email),
  idxActive: index("idx_users_active").on(table.isActive),
  idxApproval: index("idx_users_approval").on(table.approvalStatus),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
