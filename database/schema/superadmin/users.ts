import { pgTable, text, timestamp, uuid, boolean, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

// Approval status enum
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
]);

// User role enum
export const userRoleEnum = pgEnum('user_role', [
  'episcop',
  'vicar',
  'paroh',
  'secretar',
  'contabil',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  isActive: boolean('is_active').notNull().default(true),
  approvalStatus: approvalStatusEnum('approval_status').notNull().default('pending'),
  role: userRoleEnum('role').notNull().default('paroh'),
  parishId: uuid('parish_id').references(() => parishes.id),
  permissions: text('permissions').array().notNull().default([]),
  adminNotes: text('admin_notes'),
  resetToken: varchar('reset_token', { length: 255 }),
  resetTokenExpiry: timestamp('reset_token_expiry', { withTimezone: true }),
  verificationCode: varchar('verification_code', { length: 255 }),
  verificationCodeExpiry: timestamp('verification_code_expiry', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
