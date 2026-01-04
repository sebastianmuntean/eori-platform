/**
 * Authorization utilities for API routes
 */

import { db } from '@/database/client';
import { users, parishes } from '@/database/schema';
import { eq } from 'drizzle-orm';
import { AuthorizationError, NotFoundError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/auth';

/**
 * Check if user has access to a specific parish
 * Returns the user's parish ID if they have access
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

  // If user has no parish assigned, they can only access global resources (parishId = null)
  if (!user.parishId) {
    // Super admins or users without parish might have special access
    // For now, we'll be strict: users without parish can only access global resources
    if (parishId !== null) {
      throw new AuthorizationError('You do not have access to this parish');
    }
    return { userId, userParishId: null };
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
 * Add parish filter to query conditions if user is not a super admin
 */
export async function addParishFilter(conditions: any[], userParishId: string | null) {
  // If user has no parish, they might be a super admin
  // For now, we'll allow access to all parishes if user has no parish assigned
  // This can be enhanced with role-based checks later
  // if (userParishId) {
  //   conditions.push(eq(table.parishId, userParishId));
  // }
  // Note: This is a placeholder - implement based on your authorization model
}

