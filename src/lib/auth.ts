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
  console.log(`Step 1: Hashing password`);
  
  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    console.log(`✓ Password hashed successfully`);
    return hash;
  } catch (error) {
    console.error(`❌ Failed to hash password: ${error}`);
    throw error;
  }
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  console.log(`Step 1: Verifying password`);
  
  try {
    const isValid = await bcrypt.compare(password, hash);
    if (isValid) {
      console.log(`✓ Password verified`);
    } else {
      console.log(`❌ Password verification failed`);
    }
    return isValid;
  } catch (error) {
    console.error(`❌ Failed to verify password: ${error}`);
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
  console.log(`Step 1: Validating password strength`);
  
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

  const valid = errors.length === 0;

  if (valid) {
    console.log(`✓ Password strength validation passed`);
  } else {
    console.log(`❌ Password strength validation failed: ${errors.join(', ')}`);
  }

  return { valid, errors };
}

/**
 * Login user and create session
 */
export async function login(
  email: string,
  password: string,
  ipAddress?: string,
  userAgent?: string
): Promise<{ success: boolean; userId?: string; error?: string }> {
  console.log(`Step 1: Login attempt for email: ${email}`);

  try {
    // Find user by email
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return { success: false, error: 'Invalid credentials' };
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      console.log(`❌ Invalid password for user: ${email}`);
      return { success: false, error: 'Invalid credentials' };
    }

    // Create session
    const token = await createSession(user.id, ipAddress, userAgent);
    await setSessionCookie(token);

    console.log(`✓ Login successful for user: ${user.id}`);
    return { success: true, userId: user.id };
  } catch (error) {
    console.error(`❌ Login failed: ${error}`);
    return { success: false, error: 'Login failed' };
  }
}

/**
 * Logout user (delete session)
 */
export async function logout(): Promise<void> {
  console.log(`Step 1: Logout attempt`);

  const token = await getSessionToken();
  if (token) {
    await deleteSession(token);
  }
  await clearSessionCookie();

  console.log(`✓ Logout successful`);
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<{
  userId: string | null;
  user: typeof users.$inferSelect | null;
}> {
  console.log(`Step 1: Getting current user from session`);

  const token = await getSessionToken();
  if (!token) {
    console.log(`❌ No session token found`);
    return { userId: null, user: null };
  }

  const userId = await validateSession(token);
  if (!userId) {
    console.log(`❌ Invalid or expired session`);
    return { userId: null, user: null };
  }

  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      console.log(`❌ User not found: ${userId}`);
      return { userId: null, user: null };
    }

    console.log(`✓ Current user retrieved: ${user.id}`);
    return { userId, user };
  } catch (error) {
    console.error(`❌ Failed to get current user: ${error}`);
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
  console.log(`Step 1: Requiring authentication`);

  const { userId, user } = await getCurrentUser();

  if (!userId || !user) {
    console.log(`❌ Authentication required but user not found`);
    throw new AuthenticationError('Unauthorized');
  }

  console.log(`✓ Authentication verified for user: ${userId}`);
  return { userId, user };
}

/**
 * Require that current user has a specific role
 */
export async function requireRole(roleName: string): Promise<void> {
  console.log(`Step 1: Requiring role: ${roleName}`);

  const { userId } = await requireAuth();
  await rbacRequireRole(userId, roleName);
}

/**
 * Require that current user has a specific permission
 */
export async function requirePermission(permissionName: string): Promise<void> {
  console.log(`Step 1: Requiring permission: ${permissionName}`);

  const { userId } = await requireAuth();
  await rbacRequirePermission(userId, permissionName);
}

/**
 * Check if current user has a specific role
 */
export async function checkRole(roleName: string): Promise<boolean> {
  console.log(`Step 1: Checking role: ${roleName}`);

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
  console.log(`Step 1: Checking permission: ${permissionName}`);

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
  console.log(`Step 1: Invalidating all sessions for user: ${userId}`);
  await deleteAllUserSessions(userId);
  console.log(`✓ All sessions invalidated for user: ${userId}`);
}
