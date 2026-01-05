import { db } from "@/lib/db";
import { userRoles, rolePermissions, permissions, userPermissionOverrides, userResourceAccess, roles } from "@/drizzle/schema/rbac";
import { eq, and, or } from "drizzle-orm";
import { logger } from "@/lib/utils/logger";

console.log("Step 1: Loading permissions system...");

/**
 * Get user's effective permissions (from roles + overrides)
 */
export async function getUserEffectivePermissions(
  userId: string
): Promise<{ success: boolean; permissions?: string[]; error?: string }> {
  try {
    console.log(`Step 1: Getting effective permissions for user: ${userId}`);
    
    // Get user roles to check for superadmin
    const userRolesList = await db
      .select({ roleName: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    
    const hasSuperadmin = userRolesList.some((ur) => ur.roleName === 'superadmin');
    
    // Get permissions from user's roles
    let rolePerms;
    if (hasSuperadmin) {
      // For superadmin, get all permissions from database
      console.log(`✓ User has superadmin role, returning all permissions`);
      const allPerms = await db.select({ name: permissions.name }).from(permissions);
      rolePerms = allPerms.map(p => ({ permissionName: p.name }));
    } else {
      // For regular users, get permissions from their roles
      rolePerms = await db
        .select({ permissionName: permissions.name })
        .from(userRoles)
        .innerJoin(rolePermissions, eq(userRoles.roleId, rolePermissions.roleId))
        .innerJoin(permissions, eq(rolePermissions.permissionId, permissions.id))
        .where(eq(userRoles.userId, userId));
    }

    // Get user-specific permission overrides
    const overrides = await db
      .select({ 
        permissionName: permissions.name,
        granted: userPermissionOverrides.granted 
      })
      .from(userPermissionOverrides)
      .innerJoin(permissions, eq(userPermissionOverrides.permissionId, permissions.id))
      .where(eq(userPermissionOverrides.userId, userId));

    // Combine role permissions with overrides
    // Overrides take precedence (granted=true means allow, granted=false means deny)
    const permissionMap = new Map<string, boolean>();
    
    // Add role permissions (default to granted=true)
    for (const perm of rolePerms) {
      permissionMap.set(perm.permissionName, true);
    }
    
    // Apply overrides (they override role permissions)
    for (const override of overrides) {
      permissionMap.set(override.permissionName, override.granted);
    }
    
    // Filter to only granted permissions
    const effectivePermissions = Array.from(permissionMap.entries())
      .filter(([_, granted]) => granted)
      .map(([name, _]) => name);

    console.log(`✓ Found ${effectivePermissions.length} effective permissions`);
    return { success: true, permissions: effectivePermissions };
  } catch (error) {
    console.error("❌ Error fetching effective permissions:", error);
    logger.error("Error fetching effective permissions", error);
    return { success: false, error: "Error fetching permissions" };
  }
}

/**
 * Check if user has a specific permission
 */
export async function userHasPermission(
  userId: string,
  permissionName: string
): Promise<boolean> {
  try {
    console.log(`Step 1: Checking permission "${permissionName}" for user: ${userId}`);
    
    const result = await getUserEffectivePermissions(userId);
    
    if (!result.success || !result.permissions) {
      return false;
    }
    
    // Check for system.all permission or specific permission
    const hasPermission = result.permissions.includes("system.all") || 
                          result.permissions.includes(permissionName);
    
    console.log(`✓ Permission check result: ${hasPermission}`);
    return hasPermission;
  } catch (error) {
    console.error("❌ Error checking permission:", error);
    logger.error("Error checking permission", error);
    return false;
  }
}

/**
 * Get user's accessible resources for a specific resource type
 */
export async function getUserAccessibleResources(
  userId: string,
  resourceType: string
): Promise<string[]> {
  try {
    console.log(`Step 1: Getting accessible resources for user: ${userId}, type: ${resourceType}`);
    
    const resources = await db
      .select({ resourceId: userResourceAccess.resourceId })
      .from(userResourceAccess)
      .where(
        and(
          eq(userResourceAccess.userId, userId),
          eq(userResourceAccess.resourceType, resourceType),
          eq(userResourceAccess.granted, true)
        )
      );
    
    const resourceIds = resources.map(r => r.resourceId);
    console.log(`✓ Found ${resourceIds.length} accessible resources`);
    return resourceIds;
  } catch (error) {
    console.error("❌ Error fetching accessible resources:", error);
    logger.error("Error fetching accessible resources", error);
    return [];
  }
}




