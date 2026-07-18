import { db } from '@/database/client';
import { roles, permissions, rolePermissions, userRoles } from '@/database/schema';
import { eq, inArray } from 'drizzle-orm';
import { AuthorizationError } from './errors';

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<typeof roles.$inferSelect[]> {
  try {
    const userRolesList = await db
      .select({
        role: roles,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    return userRolesList.map((ur) => ur.role);
  } catch (error) {
    console.error(`Failed to get user roles for ${userId}:`, error);
    throw error;
  }
}

/**
 * Get all permissions for a user (from all their roles)
 */
export async function getUserPermissions(userId: string): Promise<typeof permissions.$inferSelect[]> {
  try {
    const userRolesList = await getUserRoles(userId);

    if (userRolesList.length === 0) {
      return [];
    }

    const roleIds = userRolesList.map((r) => r.id);

    // Superadmin gets all permissions
    const hasSuperadmin = userRolesList.some((r) => r.name === 'superadmin');
    if (hasSuperadmin) {
      return await db.select().from(permissions);
    }

    const rolePermissionsList = await db
      .select({
        permission: permissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));

    const permissionsList = rolePermissionsList.map((rp) => rp.permission);

    // Remove duplicates based on permission id
    return Array.from(
      new Map(permissionsList.map((p) => [p.id, p])).values()
    );
  } catch (error) {
    console.error(`Failed to get user permissions for ${userId}:`, error);
    throw error;
  }
}

/**
 * Get user's effective permission names (role-based).
 * Used by GET /api/auth/permissions for the UI permission list.
 *
 * Note: user_permission_overrides / user_resource_access are not in the
 * canonical schema; enforcement is role-based only.
 */
export async function getUserEffectivePermissions(
  userId: string
): Promise<{ success: boolean; permissions?: string[]; error?: string }> {
  try {
    const userPermissions = await getUserPermissions(userId);
    const permissionNames = userPermissions
      .map((p) => p.name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0);

    return { success: true, permissions: permissionNames };
  } catch (error) {
    console.error(`Failed to fetch effective permissions for ${userId}:`, error);
    return { success: false, error: 'Error fetching permissions' };
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  try {
    const userRolesList = await getUserRoles(userId);
    return userRolesList.some((r) => r.name === roleName);
  } catch (error) {
    console.error(`Failed to check role ${roleName} for ${userId}:`, error);
    return false;
  }
}

/**
 * Check if user has a specific permission.
 * Users with `system.all` are treated as having every permission.
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissions(userId);
    return userPermissions.some(
      (p) => p.name === permissionName || p.name === 'system.all'
    );
  } catch (error) {
    console.error(`Failed to check permission ${permissionName} for ${userId}:`, error);
    return false;
  }
}

/**
 * Require that user has a specific role, throw error if not
 */
export async function requireRole(userId: string, roleName: string): Promise<void> {
  const hasRoleResult = await hasRole(userId, roleName);

  if (!hasRoleResult) {
    throw new AuthorizationError(`Required role: ${roleName}`);
  }
}

/**
 * Require that user has a specific permission, throw error if not
 */
export async function requirePermission(userId: string, permissionName: string): Promise<void> {
  const hasPermissionResult = await hasPermission(userId, permissionName);

  if (!hasPermissionResult) {
    throw new AuthorizationError(`Required permission: ${permissionName}`);
  }
}

/**
 * Get user with roles (optimized query)
 */
export async function getUserWithRoles(userId: string): Promise<{
  roles: typeof roles.$inferSelect[];
  permissions: typeof permissions.$inferSelect[];
}> {
  try {
    const [userRolesList, userPermissions] = await Promise.all([
      getUserRoles(userId),
      getUserPermissions(userId),
    ]);

    return {
      roles: userRolesList,
      permissions: userPermissions,
    };
  } catch (error) {
    console.error(`Failed to get user with roles for ${userId}:`, error);
    throw error;
  }
}
