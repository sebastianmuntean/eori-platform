/**
 * Online Forms module permission constants
 * 
 * These permissions follow the pattern: onlineForms.{resource}.{action}
 * All permissions are defined in the database migration
 * 
 * Note: Mapping Datasets are also managed through registratura.mappingDatasets
 */

export const ONLINE_FORMS_PERMISSIONS = {
  // Forms
  VIEW: 'onlineForms.view',
  CREATE: 'onlineForms.create',
  UPDATE: 'onlineForms.update',
  DELETE: 'onlineForms.delete',

  // Submissions
  SUBMISSIONS_VIEW: 'onlineForms.submissions.view',
  SUBMISSIONS_PROCESS: 'onlineForms.submissions.process',
  SUBMISSIONS_DELETE: 'onlineForms.submissions.delete',

  // Mapping Datasets
  MAPPING_DATASETS_VIEW: 'onlineForms.mappingDatasets.view',
  MAPPING_DATASETS_CREATE: 'onlineForms.mappingDatasets.create',
  MAPPING_DATASETS_UPDATE: 'onlineForms.mappingDatasets.update',
  MAPPING_DATASETS_DELETE: 'onlineForms.mappingDatasets.delete',
} as const;

export type OnlineFormsPermission = typeof ONLINE_FORMS_PERMISSIONS[keyof typeof ONLINE_FORMS_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Online Forms permission
 */
export function isOnlineFormsPermission(permission: string): permission is OnlineFormsPermission {
  return Object.values(ONLINE_FORMS_PERMISSIONS).includes(permission as OnlineFormsPermission);
}

/**
 * Get all Online Forms permissions as an array
 */
export function getAllOnlineFormsPermissions(): OnlineFormsPermission[] {
  return Object.values(ONLINE_FORMS_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const ONLINE_FORMS_PERMISSION_GROUPS = {
  forms: [
    ONLINE_FORMS_PERMISSIONS.VIEW,
    ONLINE_FORMS_PERMISSIONS.CREATE,
    ONLINE_FORMS_PERMISSIONS.UPDATE,
    ONLINE_FORMS_PERMISSIONS.DELETE,
  ],
  submissions: [
    ONLINE_FORMS_PERMISSIONS.SUBMISSIONS_VIEW,
    ONLINE_FORMS_PERMISSIONS.SUBMISSIONS_PROCESS,
    ONLINE_FORMS_PERMISSIONS.SUBMISSIONS_DELETE,
  ],
  mappingDatasets: [
    ONLINE_FORMS_PERMISSIONS.MAPPING_DATASETS_VIEW,
    ONLINE_FORMS_PERMISSIONS.MAPPING_DATASETS_CREATE,
    ONLINE_FORMS_PERMISSIONS.MAPPING_DATASETS_UPDATE,
    ONLINE_FORMS_PERMISSIONS.MAPPING_DATASETS_DELETE,
  ],
} as const;


