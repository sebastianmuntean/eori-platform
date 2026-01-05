/**
 * Analytics module permission constants
 * 
 * These permissions follow the pattern: analytics.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const ANALYTICS_PERMISSIONS = {
  // Analytics (general)
  VIEW: 'analytics.view',

  // Reports
  REPORTS_VIEW: 'analytics.reports.view',
  REPORTS_EXPORT: 'analytics.reports.export',
} as const;

export type AnalyticsPermission = typeof ANALYTICS_PERMISSIONS[keyof typeof ANALYTICS_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Analytics permission
 */
export function isAnalyticsPermission(permission: string): permission is AnalyticsPermission {
  return Object.values(ANALYTICS_PERMISSIONS).includes(permission as AnalyticsPermission);
}

/**
 * Get all Analytics permissions as an array
 */
export function getAllAnalyticsPermissions(): AnalyticsPermission[] {
  return Object.values(ANALYTICS_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const ANALYTICS_PERMISSION_GROUPS = {
  analytics: [
    ANALYTICS_PERMISSIONS.VIEW,
  ],
  reports: [
    ANALYTICS_PERMISSIONS.REPORTS_VIEW,
    ANALYTICS_PERMISSIONS.REPORTS_EXPORT,
  ],
} as const;


