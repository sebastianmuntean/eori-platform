/**
 * Administration module permission constants
 * 
 * These permissions follow the pattern: administration.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const ADMINISTRATION_PERMISSIONS = {
  // Dioceses
  DIOCESES_VIEW: 'administration.dioceses.view',
  DIOCESES_CREATE: 'administration.dioceses.create',
  DIOCESES_UPDATE: 'administration.dioceses.update',
  DIOCESES_DELETE: 'administration.dioceses.delete',

  // Deaneries
  DEANERIES_VIEW: 'administration.deaneries.view',
  DEANERIES_CREATE: 'administration.deaneries.create',
  DEANERIES_UPDATE: 'administration.deaneries.update',
  DEANERIES_DELETE: 'administration.deaneries.delete',

  // Parishes
  PARISHES_VIEW: 'administration.parishes.view',
  PARISHES_CREATE: 'administration.parishes.create',
  PARISHES_UPDATE: 'administration.parishes.update',
  PARISHES_DELETE: 'administration.parishes.delete',

  // Departments
  DEPARTMENTS_VIEW: 'administration.departments.view',
  DEPARTMENTS_CREATE: 'administration.departments.create',
  DEPARTMENTS_UPDATE: 'administration.departments.update',
  DEPARTMENTS_DELETE: 'administration.departments.delete',

  // Users
  USERS_VIEW: 'administration.users.view',
  USERS_CREATE: 'administration.users.create',
  USERS_UPDATE: 'administration.users.update',
  USERS_DELETE: 'administration.users.delete',
  USERS_EXPORT: 'administration.users.export',
  USERS_IMPORT: 'administration.users.import',

  // Email Templates
  EMAIL_TEMPLATES_VIEW: 'administration.emailTemplates.view',
  EMAIL_TEMPLATES_CREATE: 'administration.emailTemplates.create',
  EMAIL_TEMPLATES_UPDATE: 'administration.emailTemplates.update',
  EMAIL_TEMPLATES_DELETE: 'administration.emailTemplates.delete',
  EMAIL_TEMPLATES_SEND: 'administration.emailTemplates.send',
  EMAIL_TEMPLATES_SEND_BULK: 'administration.emailTemplates.sendBulk',

  // Notifications
  NOTIFICATIONS_VIEW: 'administration.notifications.view',
  NOTIFICATIONS_CREATE: 'administration.notifications.create',
  NOTIFICATIONS_SEND: 'administration.notifications.send',
  NOTIFICATIONS_DELETE: 'administration.notifications.delete',
} as const;

export type AdministrationPermission = typeof ADMINISTRATION_PERMISSIONS[keyof typeof ADMINISTRATION_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Administration permission
 */
export function isAdministrationPermission(permission: string): permission is AdministrationPermission {
  return Object.values(ADMINISTRATION_PERMISSIONS).includes(permission as AdministrationPermission);
}

/**
 * Get all Administration permissions as an array
 */
export function getAllAdministrationPermissions(): AdministrationPermission[] {
  return Object.values(ADMINISTRATION_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const ADMINISTRATION_PERMISSION_GROUPS = {
  dioceses: [
    ADMINISTRATION_PERMISSIONS.DIOCESES_VIEW,
    ADMINISTRATION_PERMISSIONS.DIOCESES_CREATE,
    ADMINISTRATION_PERMISSIONS.DIOCESES_UPDATE,
    ADMINISTRATION_PERMISSIONS.DIOCESES_DELETE,
  ],
  deaneries: [
    ADMINISTRATION_PERMISSIONS.DEANERIES_VIEW,
    ADMINISTRATION_PERMISSIONS.DEANERIES_CREATE,
    ADMINISTRATION_PERMISSIONS.DEANERIES_UPDATE,
    ADMINISTRATION_PERMISSIONS.DEANERIES_DELETE,
  ],
  parishes: [
    ADMINISTRATION_PERMISSIONS.PARISHES_VIEW,
    ADMINISTRATION_PERMISSIONS.PARISHES_CREATE,
    ADMINISTRATION_PERMISSIONS.PARISHES_UPDATE,
    ADMINISTRATION_PERMISSIONS.PARISHES_DELETE,
  ],
  departments: [
    ADMINISTRATION_PERMISSIONS.DEPARTMENTS_VIEW,
    ADMINISTRATION_PERMISSIONS.DEPARTMENTS_CREATE,
    ADMINISTRATION_PERMISSIONS.DEPARTMENTS_UPDATE,
    ADMINISTRATION_PERMISSIONS.DEPARTMENTS_DELETE,
  ],
  users: [
    ADMINISTRATION_PERMISSIONS.USERS_VIEW,
    ADMINISTRATION_PERMISSIONS.USERS_CREATE,
    ADMINISTRATION_PERMISSIONS.USERS_UPDATE,
    ADMINISTRATION_PERMISSIONS.USERS_DELETE,
    ADMINISTRATION_PERMISSIONS.USERS_EXPORT,
    ADMINISTRATION_PERMISSIONS.USERS_IMPORT,
  ],
  emailTemplates: [
    ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_VIEW,
    ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_CREATE,
    ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_UPDATE,
    ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_DELETE,
    ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_SEND,
    ADMINISTRATION_PERMISSIONS.EMAIL_TEMPLATES_SEND_BULK,
  ],
  notifications: [
    ADMINISTRATION_PERMISSIONS.NOTIFICATIONS_VIEW,
    ADMINISTRATION_PERMISSIONS.NOTIFICATIONS_CREATE,
    ADMINISTRATION_PERMISSIONS.NOTIFICATIONS_SEND,
    ADMINISTRATION_PERMISSIONS.NOTIFICATIONS_DELETE,
  ],
} as const;






