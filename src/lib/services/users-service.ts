import { randomBytes } from 'crypto';
import { db } from '@/database/client';
import { users } from '@/database/schema';
import { hashPassword } from '@/lib/auth';
import { sendUserConfirmationEmail } from '@/lib/email';
import { generateVerificationToken } from '@/lib/auth/tokens';
import { logCreate, logUpdate, logDelete } from '@/lib/audit/audit-logger';
import { eq, like, or, and, sql } from 'drizzle-orm';
import { NotFoundError, ValidationError } from '@/lib/errors';
import { createOrderBy } from '@/lib/api-utils/sorting';
import { sanitizeSearch, validateEnum } from '@/lib/api-utils/validation';
import { calculatePagination } from '@/lib/api-utils/pagination';
import type { CreateUserInput, UpdateUserInput } from '@/lib/validations/users';
import { logger } from '@/lib/utils/logger';

const ALLOWED_SORT_FIELDS = ['createdAt', 'email'] as const;
const ALLOWED_STATUS = ['active', 'inactive'] as const;
const ALLOWED_APPROVAL_STATUS = ['pending', 'approved', 'rejected'] as const;

export type UserWithoutPassword = Omit<typeof users.$inferSelect, 'passwordHash'>;

export interface ListUsersParams {
  page: number;
  pageSize: number;
  offset: number;
  search?: string | null;
  status?: string | null;
  approvalStatus?: string | null;
  sortBy?: string | null;
  sortOrder?: 'asc' | 'desc';
}

export interface AuditRequestContext {
  ipAddress?: string | null;
  userAgent?: string | null;
  requestMethod: string;
  endpoint: string;
}

function stripPassword<T extends { passwordHash?: string | null }>(
  user: T
): Omit<T, 'passwordHash'> {
  const { passwordHash: _passwordHash, ...rest } = user;
  return rest;
}

/**
 * List users with filtering, sorting, and pagination
 */
export async function listUsers(params: ListUsersParams) {
  const {
    page,
    pageSize,
    offset,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  } = params;

  const search = sanitizeSearch(params.search ?? null);
  const status = validateEnum(params.status ?? null, ALLOWED_STATUS, null);
  const approvalStatus = validateEnum(
    params.approvalStatus ?? null,
    ALLOWED_APPROVAL_STATUS,
    null
  );

  const conditions = [];

  if (search) {
    conditions.push(
      or(
        like(users.email, `%${search}%`),
        like(users.name, `%${search}%`),
        like(users.address || '', `%${search}%`),
        like(users.city || '', `%${search}%`),
        like(users.phone || '', `%${search}%`)
      )!
    );
  }

  if (status === 'active') {
    conditions.push(eq(users.isActive, true));
  } else if (status === 'inactive') {
    conditions.push(eq(users.isActive, false));
  }

  if (approvalStatus) {
    conditions.push(eq(users.approvalStatus, approvalStatus));
  }

  const whereClause =
    conditions.length === 0
      ? undefined
      : conditions.length === 1
        ? conditions[0]
        : and(...conditions);

  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(whereClause);
  const totalCount = Number(totalCountResult[0]?.count || 0);

  const orderBy = createOrderBy(
    users,
    sortBy,
    'createdAt',
    ALLOWED_SORT_FIELDS,
    sortOrder
  );

  const allUsers = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(pageSize)
    .offset(offset);

  return {
    data: allUsers.map(stripPassword),
    pagination: calculatePagination(totalCount, page, pageSize),
  };
}

/**
 * Create a new user and send confirmation email
 */
export async function createUser(
  input: CreateUserInput,
  actorUserId: string,
  auditContext: AuditRequestContext
): Promise<UserWithoutPassword> {
  const { email, name, role, address, city, phone, isActive, approvalStatus } = input;

  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  const verificationToken = generateVerificationToken();
  const verificationExpiry = new Date();
  verificationExpiry.setDate(verificationExpiry.getDate() + 7);

  const tempPassword = randomBytes(16).toString('hex');
  const tempPasswordHash = await hashPassword(tempPassword);

  const insertValues: {
    email: string;
    name: string;
    role: 'episcop' | 'vicar' | 'paroh' | 'secretar' | 'contabil';
    passwordHash: string;
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    isActive: boolean;
    approvalStatus: 'pending' | 'approved' | 'rejected';
  } = {
    email,
    name: name || '',
    role: role || 'paroh',
    passwordHash: tempPasswordHash,
    isActive: isActive ?? true,
    approvalStatus: approvalStatus || 'pending',
  };

  if (address) insertValues.address = address;
  if (city) insertValues.city = city;
  if (phone) insertValues.phone = phone;

  const [newUser] = await db.insert(users).values(insertValues).returning();

  const locale = 'ro';
  const confirmationLink = `${process.env.APP_URL || 'http://localhost:4058'}/${locale}/confirm-password?token=${verificationToken}`;

  sendUserConfirmationEmail(email, name || email, confirmationLink).catch((error) => {
    logger.error('Failed to send confirmation email', error, { userId: newUser.id });
  });

  await db
    .update(users)
    .set({
      verificationCode: verificationToken,
      verificationCodeExpiry: verificationExpiry,
    })
    .where(eq(users.id, newUser.id));

  logCreate(actorUserId, 'user', newUser.id, {
    ipAddress: auditContext.ipAddress,
    userAgent: auditContext.userAgent,
    requestMethod: auditContext.requestMethod,
    endpoint: auditContext.endpoint,
  }).catch((err) => {
    logger.error('Failed to log user creation audit event', err);
  });

  return stripPassword(newUser);
}

/**
 * Update an existing user
 */
export async function updateUser(
  userId: string,
  input: UpdateUserInput,
  actorUserId: string,
  auditContext: AuditRequestContext
): Promise<UserWithoutPassword> {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  if (input.email && input.email !== existingUser.email) {
    const [emailUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, input.email))
      .limit(1);

    if (emailUser) {
      throw new ValidationError('Email is already taken');
    }
  }

  const beforeState = {
    name: existingUser.name,
    email: existingUser.email,
    role: existingUser.role,
    address: existingUser.address,
    city: existingUser.city,
    phone: existingUser.phone,
    isActive: existingUser.isActive,
    approvalStatus: existingUser.approvalStatus,
  };

  const updateData: {
    updatedAt: Date;
    name?: string;
    email?: string;
    role?: 'episcop' | 'vicar' | 'paroh' | 'secretar' | 'contabil';
    address?: string | null;
    city?: string | null;
    phone?: string | null;
    isActive?: boolean;
    approvalStatus?: 'pending' | 'approved' | 'rejected';
  } = {
    updatedAt: new Date(),
  };

  if (input.name !== undefined) updateData.name = input.name;
  if (input.email !== undefined) updateData.email = input.email;
  if (input.role !== undefined) updateData.role = input.role;
  if (input.address !== undefined) updateData.address = input.address || null;
  if (input.city !== undefined) updateData.city = input.city || null;
  if (input.phone !== undefined) updateData.phone = input.phone || null;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.approvalStatus !== undefined) updateData.approvalStatus = input.approvalStatus;

  const [updatedUser] = await db
    .update(users)
    .set(updateData)
    .where(eq(users.id, userId))
    .returning();

  const afterState = {
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
    address: updatedUser.address,
    city: updatedUser.city,
    phone: updatedUser.phone,
    isActive: updatedUser.isActive,
    approvalStatus: updatedUser.approvalStatus,
  };

  logUpdate(
    actorUserId,
    'user',
    userId,
    { before: beforeState, after: afterState },
    {
      ipAddress: auditContext.ipAddress,
      userAgent: auditContext.userAgent,
      requestMethod: auditContext.requestMethod,
      endpoint: auditContext.endpoint,
    }
  ).catch((err) => {
    logger.error('Failed to log user update audit event', err);
  });

  return stripPassword(updatedUser);
}

/**
 * Soft-delete a user by setting isActive to false
 */
export async function softDeleteUser(
  userId: string,
  actorUserId: string,
  auditContext: AuditRequestContext
): Promise<void> {
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  await db
    .update(users)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  logDelete(actorUserId, 'user', userId, {
    ipAddress: auditContext.ipAddress,
    userAgent: auditContext.userAgent,
    requestMethod: auditContext.requestMethod,
    endpoint: auditContext.endpoint,
    metadata: {
      softDelete: true,
      previousState: {
        isActive: existingUser.isActive,
      },
    },
  }).catch((err) => {
    logger.error('Failed to log user deletion audit event', err);
  });
}
