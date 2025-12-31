import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";

// User role enum
export const userRoleEnum = pgEnum("user_role", [
  "episcop",
  "vicar",
  "paroh",
  "secretar",
  "contabil",
]);

// Approval status enum
export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull(),
  parohieId: uuid("parohie_id"),
  permissions: text("permissions").array().notNull().default([]),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  isActive: boolean("is_active").notNull().default(true),
  approvalStatus: approvalStatusEnum("approval_status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  resetToken: varchar("reset_token", { length: 255 }),
  resetTokenExpiry: timestamp("reset_token_expiry", { withTimezone: true }),
  verificationCode: varchar("verification_code", { length: 10 }),
  verificationCodeExpiry: timestamp("verification_code_expiry", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});




