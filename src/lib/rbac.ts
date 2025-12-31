import { db } from '@/database/client';
import { roles, permissions, rolePermissions, userRoles } from '@/database/schema';
import { eq, and, inArray } from 'drizzle-orm';
import { AuthorizationError } from './errors';

/**
 * Get all roles for a user
 */
export async function getUserRoles(userId: string): Promise<typeof roles.$inferSelect[]> {
  console.log(`Step 1: Getting roles for user: ${userId}`);

  try {
    const userRolesList = await db
      .select({
        role: roles,
      })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));

    const rolesList = userRolesList.map((ur) => ur.role);
    console.log(`✓ Found ${rolesList.length} roles for user ${userId}`);
    return rolesList;
  } catch (error) {
    console.error(`❌ Failed to get user roles: ${error}`);
    throw error;
  }
}

/**
 * Get all permissions for a user (from all their roles)
 */
export async function getUserPermissions(userId: string): Promise<typeof permissions.$inferSelect[]> {
  console.log(`Step 1: Getting permissions for user: ${userId}`);

  try {
    // First get all roles for the user
    const userRolesList = await getUserRoles(userId);
    
    if (userRolesList.length === 0) {
      console.log(`✓ No roles found for user, returning empty permissions`);
      return [];
    }

    const roleIds = userRolesList.map((r) => r.id);

    // Check if user has superadmin role (all permissions)
    const hasSuperadmin = userRolesList.some((r) => r.name === 'superadmin');
    if (hasSuperadmin) {
      console.log(`✓ User has superadmin role, returning all permissions`);
      const allPermissions = await db.select().from(permissions);
      return allPermissions;
    }

    // Get all permissions for these roles
    const rolePermissionsList = await db
      .select({
        permission: permissions,
      })
      .from(rolePermissions)
      .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
      .where(inArray(rolePermissions.roleId, roleIds));

    const permissionsList = rolePermissionsList.map((rp) => rp.permission);
    
    // Remove duplicates based on permission id
    const uniquePermissions = Array.from(
      new Map(permissionsList.map((p) => [p.id, p])).values()
    );

    console.log(`✓ Found ${uniquePermissions.length} unique permissions for user ${userId}`);
    return uniquePermissions;
  } catch (error) {
    console.error(`❌ Failed to get user permissions: ${error}`);
    throw error;
  }
}

/**
 * Check if user has a specific role
 */
export async function hasRole(userId: string, roleName: string): Promise<boolean> {
  console.log(`Step 1: Checking if user ${userId} has role: ${roleName}`);

  try {
    const userRolesList = await getUserRoles(userId);
    const hasRole = userRolesList.some((r) => r.name === roleName);
    
    if (hasRole) {
      console.log(`✓ User has role: ${roleName}`);
    } else {
      console.log(`❌ User does not have role: ${roleName}`);
    }
    
    return hasRole;
  } catch (error) {
    console.error(`❌ Failed to check role: ${error}`);
    return false;
  }
}

/**
 * Check if user has a specific permission
 */
export async function hasPermission(userId: string, permissionName: string): Promise<boolean> {
  console.log(`Step 1: Checking if user ${userId} has permission: ${permissionName}`);

  try {
    const userPermissions = await getUserPermissions(userId);
    const hasPermission = userPermissions.some((p) => p.name === permissionName);
    
    if (hasPermission) {
      console.log(`✓ User has permission: ${permissionName}`);
    } else {
      console.log(`❌ User does not have permission: ${permissionName}`);
    }
    
    return hasPermission;
  } catch (error) {
    console.error(`❌ Failed to check permission: ${error}`);
    return false;
  }
}

/**
 * Require that user has a specific role, throw error if not
 */
export async function requireRole(userId: string, roleName: string): Promise<void> {
  console.log(`Step 1: Requiring role ${roleName} for user: ${userId}`);

  const hasRoleResult = await hasRole(userId, roleName);
  
  if (!hasRoleResult) {
    console.log(`❌ User ${userId} does not have required role: ${roleName}`);
    throw new AuthorizationError(`Required role: ${roleName}`);
  }

  console.log(`✓ User has required role: ${roleName}`);
}

/**
 * Require that user has a specific permission, throw error if not
 */
export async function requirePermission(userId: string, permissionName: string): Promise<void> {
  console.log(`Step 1: Requiring permission ${permissionName} for user: ${userId}`);

  const hasPermissionResult = await hasPermission(userId, permissionName);
  
  if (!hasPermissionResult) {
    console.log(`❌ User ${userId} does not have required permission: ${permissionName}`);
    throw new AuthorizationError(`Required permission: ${permissionName}`);
  }

  console.log(`✓ User has required permission: ${permissionName}`);
}

/**
 * Get user with roles (optimized query)
 */
export async function getUserWithRoles(userId: string): Promise<{
  roles: typeof roles.$inferSelect[];
  permissions: typeof permissions.$inferSelect[];
}> {
  console.log(`Step 1: Getting user with roles and permissions: ${userId}`);

  try {
    const [userRolesList, userPermissions] = await Promise.all([
      getUserRoles(userId),
      getUserPermissions(userId),
    ]);

    console.log(`✓ Retrieved user with ${userRolesList.length} roles and ${userPermissions.length} permissions`);
    
    return {
      roles: userRolesList,
      permissions: userPermissions,
    };
  } catch (error) {
    console.error(`❌ Failed to get user with roles: ${error}`);
    throw error;
  }
}

