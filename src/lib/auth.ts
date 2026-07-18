import { db } from '@/database/client';
import { users } from '@/database/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import {
  createSession,
  setSessionCookie,
  deleteSession,
  clearSessionCookie,
  deleteAllUserSessions,
  getSessionToken,
  validateSession,
} from './session';
import {
  requireRole as rbacRequireRole,
  requirePermission as rbacRequirePermission,
  hasRole,
  hasPermission,
} from './rbac';
import { AuthenticationError } from './errors';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Login user and create session
 */
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{
  success: boolean;
  userId?: string;
  user?: { id: string; email: string; name: string };
  error?: string;
}> {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    if (!user.isActive) {
      return { success: false, error: 'Account is inactive' };
    }

    if (user.approvalStatus !== 'approved') {
      return { success: false, error: 'Account pending approval' };
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = await createSession(user.id, ipAddress, userAgent);
    await setSessionCookie(token);

    return {
      success: true,
      userId: user.id,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  } catch {
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Logout user (delete session)
 */
export async function logout(): Promise<void> {
  const token = await getSessionToken();
  if (token) {
    await deleteSession(token);
  }
  await clearSessionCookie();
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<{
  userId: string | null;
  user: typeof users.$inferSelect | null;
}> {
  const token = await getSessionToken();
  if (!token) {
    return { userId: null, user: null };
  }

  const userId = await validateSession(token);
  if (!userId) {
    return { userId: null, user: null };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return { userId: null, user: null };
    }

    return { userId, user };
  } catch {
    return { userId: null, user: null };
  }
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<{
  userId: string;
  user: typeof users.$inferSelect;
}> {
  const { userId, user } = await getCurrentUser();

  if (!userId || !user) {
    throw new AuthenticationError('Unauthorized');
  }

  return { userId, user };
}

/**
 * Require that current user has a specific role
 */
export async function requireRole(roleName: string): Promise<void> {
  const { userId } = await requireAuth();
  await rbacRequireRole(userId, roleName);
}

/**
 * Require that current user has a specific permission
 */
export async function requirePermission(permissionName: string): Promise<void> {
  const { userId } = await requireAuth();
  await rbacRequirePermission(userId, permissionName);
}

/**
 * Check if current user has a specific role
 */
export async function checkRole(roleName: string): Promise<boolean> {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return false;
  }

  return await hasRole(userId, roleName);
}

/**
 * Check if current user has a specific permission
 */
export async function checkPermission(permissionName: string): Promise<boolean> {
  const { userId } = await getCurrentUser();
  if (!userId) {
    return false;
  }

  return await hasPermission(userId, permissionName);
}

/**
 * Invalidate all sessions for a user (e.g., on password change)
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await deleteAllUserSessions(userId);
}
