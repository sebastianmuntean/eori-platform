import { pgTable, text, timestamp, uuid, boolean, varchar, pgEnum } from 'drizzle-orm/pg-core';

// Approval status enum
export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
]);

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  name: text('name'),
  address: text('address'),
  city: text('city'),
  phone: text('phone'),
  isActive: boolean('is_active').default(true),
  approvalStatus: approvalStatusEnum('approval_status').default('pending'),
  resetToken: text('reset_token'),
  resetTokenExpiry: timestamp('reset_token_expiry', { withTimezone: true }),
  verificationCode: text('verification_code'), // Can store up to 64 characters (32 bytes hex)
  verificationCodeExpiry: timestamp('verification_code_expiry', { withTimezone: true }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});



