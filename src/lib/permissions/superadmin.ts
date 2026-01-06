/**
 * Superadmin module permission constants
 * 
 * These permissions follow the pattern: superadmin.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const SUPERADMIN_PERMISSIONS = {
  // Roles
  ROLES_VIEW: 'superadmin.roles.view',
  ROLES_CREATE: 'superadmin.roles.create',
  ROLES_UPDATE: 'superadmin.roles.update',
  ROLES_DELETE: 'superadmin.roles.delete',

  // Permissions
  PERMISSIONS_VIEW: 'superadmin.permissions.view',
  PERMISSIONS_CREATE: 'superadmin.permissions.create',
  PERMISSIONS_UPDATE: 'superadmin.permissions.update',
  PERMISSIONS_DELETE: 'superadmin.permissions.delete',
  PERMISSIONS_BULK_DELETE: 'superadmin.permissions.bulkDelete',

  // User Roles
  USER_ROLES_VIEW: 'superadmin.userRoles.view',
  USER_ROLES_ASSIGN: 'superadmin.userRoles.assign',
  USER_ROLES_REMOVE: 'superadmin.userRoles.remove',

  // Role Permissions
  ROLE_PERMISSIONS_VIEW: 'superadmin.rolePermissions.view',
  ROLE_PERMISSIONS_ASSIGN: 'superadmin.rolePermissions.assign',
  ROLE_PERMISSIONS_REMOVE: 'superadmin.rolePermissions.remove',
} as const;

export type SuperadminPermission = typeof SUPERADMIN_PERMISSIONS[keyof typeof SUPERADMIN_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Superadmin permission
 */
export function isSuperadminPermission(permission: string): permission is SuperadminPermission {
  return Object.values(SUPERADMIN_PERMISSIONS).includes(permission as SuperadminPermission);
}

/**
 * Get all Superadmin permissions as an array
 */
export function getAllSuperadminPermissions(): SuperadminPermission[] {
  return Object.values(SUPERADMIN_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const SUPERADMIN_PERMISSION_GROUPS = {
  roles: [
    SUPERADMIN_PERMISSIONS.ROLES_VIEW,
    SUPERADMIN_PERMISSIONS.ROLES_CREATE,
    SUPERADMIN_PERMISSIONS.ROLES_UPDATE,
    SUPERADMIN_PERMISSIONS.ROLES_DELETE,
  ],
  permissions: [
    SUPERADMIN_PERMISSIONS.PERMISSIONS_VIEW,
    SUPERADMIN_PERMISSIONS.PERMISSIONS_CREATE,
    SUPERADMIN_PERMISSIONS.PERMISSIONS_UPDATE,
    SUPERADMIN_PERMISSIONS.PERMISSIONS_DELETE,
    SUPERADMIN_PERMISSIONS.PERMISSIONS_BULK_DELETE,
  ],
  userRoles: [
    SUPERADMIN_PERMISSIONS.USER_ROLES_VIEW,
    SUPERADMIN_PERMISSIONS.USER_ROLES_ASSIGN,
    SUPERADMIN_PERMISSIONS.USER_ROLES_REMOVE,
  ],
  rolePermissions: [
    SUPERADMIN_PERMISSIONS.ROLE_PERMISSIONS_VIEW,
    SUPERADMIN_PERMISSIONS.ROLE_PERMISSIONS_ASSIGN,
    SUPERADMIN_PERMISSIONS.ROLE_PERMISSIONS_REMOVE,
  ],
} as const;






