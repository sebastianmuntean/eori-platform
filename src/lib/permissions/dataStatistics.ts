/**
 * Data Statistics module permission constants
 * 
 * These permissions follow the pattern: dataStatistics.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const DATA_STATISTICS_PERMISSIONS = {
  // Data Statistics (general)
  VIEW: 'dataStatistics.view',
  EXPORT: 'dataStatistics.export',

  // Fake Data (dev/admin only)
  GENERATE_FAKE_DATA: 'dataStatistics.generateFakeData',
  DELETE_FAKE_DATA: 'dataStatistics.deleteFakeData',
} as const;

export type DataStatisticsPermission = typeof DATA_STATISTICS_PERMISSIONS[keyof typeof DATA_STATISTICS_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Data Statistics permission
 */
export function isDataStatisticsPermission(permission: string): permission is DataStatisticsPermission {
  return Object.values(DATA_STATISTICS_PERMISSIONS).includes(permission as DataStatisticsPermission);
}

/**
 * Get all Data Statistics permissions as an array
 */
export function getAllDataStatisticsPermissions(): DataStatisticsPermission[] {
  return Object.values(DATA_STATISTICS_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const DATA_STATISTICS_PERMISSION_GROUPS = {
  statistics: [
    DATA_STATISTICS_PERMISSIONS.VIEW,
    DATA_STATISTICS_PERMISSIONS.EXPORT,
  ],
  fakeData: [
    DATA_STATISTICS_PERMISSIONS.GENERATE_FAKE_DATA,
    DATA_STATISTICS_PERMISSIONS.DELETE_FAKE_DATA,
  ],
} as const;


