/**
 * Authorization utilities for API routes
 */

import { db } from '@/database/client';
import { parishes } from '@/database/schema';
import { SQL, eq } from 'drizzle-orm';
import { AuthorizationError, NotFoundError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';
import { hasRole } from '@/lib/rbac';

/**
 * Check if user has access to a specific parish
 * Returns the user's parish ID if they have access
 * Superadmin role bypasses parish restriction (access to any parish).
 */
export async function requireParishAccess(
  parishId: string | null | undefined,
  requireOwnership: boolean = false
): Promise<{ userId: string; userParishId: string | null }> {
  const { userId, user } = await getCurrentUser();

  if (!userId || !user) {
    throw new AuthorizationError('Not authenticated');
  }

  // If no specific parish is required, just return user info
  if (!parishId) {
    return { userId, userParishId: user.parishId || null };
  }

  // Superadmin has access to any parish
  const isSuperadmin = await hasRole(userId, 'superadmin');
  if (isSuperadmin) {
    const [parish] = await db
      .select()
      .from(parishes)
      .where(eq(parishes.id, parishId))
      .limit(1);
    if (!parish) {
      throw new NotFoundError('Parish not found');
    }
    return { userId, userParishId: user.parishId || null };
  }

  // If user has no parish assigned, they can only access global resources (parishId = null)
  if (!user.parishId) {
    throw new AuthorizationError('You do not have access to this parish');
  }

  // If ownership is required, user must belong to the parish
  if (requireOwnership && user.parishId !== parishId) {
    throw new AuthorizationError('You do not have access to this parish');
  }

  // Verify parish exists
  const [parish] = await db
    .select()
    .from(parishes)
    .where(eq(parishes.id, parishId))
    .limit(1);

  if (!parish) {
    throw new NotFoundError('Parish not found');
  }

  return { userId, userParishId: user.parishId };
}

/**
 * Check if user can access a resource by parish ID
 * Returns true if user's parish matches or user has global access
 */
export async function canAccessParishResource(parishId: string | null): Promise<boolean> {
  const { userId, user } = await getCurrentUser();

  if (!userId || !user) {
    return false;
  }

  // Global resources (parishId = null) are accessible to all authenticated users
  if (parishId === null) {
    return true;
  }

  // User must belong to the parish
  return user.parishId === parishId;
}

/**
 * Sync helper: build a parish_id equality condition when userParishId is set.
 * Returns undefined when no parish scoping should apply.
 */
export function buildParishCondition<T extends { parishId: any }>(
  table: T,
  userParishId: string | null
): SQL | undefined {
  if (!userParishId) {
    return undefined;
  }
  return eq(table.parishId, userParishId);
}

/**
 * Appends a parish_id equality condition when the user is parish-scoped.
 * Superadmins (or users with no parishId who are superadmin) see all.
 * Global users without a parish (and not filtered above) also see all.
 * Returns the possibly-mutated conditions array.
 */
export async function addParishFilter<T extends { parishId: any }>(
  conditions: SQL[],
  table: T,
  userParishId: string | null,
  userId?: string
): Promise<SQL[]> {
  if (userId) {
    const isSuperadmin = await hasRole(userId, 'superadmin');
    if (isSuperadmin) {
      return conditions;
    }
  }

  const parishCondition = buildParishCondition(table, userParishId);
  if (parishCondition) {
    conditions.push(parishCondition);
  }

  // No parishId → no filter: global users without a parish see all records.
  return conditions;
}
