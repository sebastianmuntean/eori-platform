/**
 * Registratura module permission constants
 * 
 * These permissions follow the pattern: registratura.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const REGISTRATURA_PERMISSIONS = {
  // Documents
  DOCUMENTS_VIEW: 'registratura.documents.view',
  DOCUMENTS_CREATE: 'registratura.documents.create',
  DOCUMENTS_UPDATE: 'registratura.documents.update',
  DOCUMENTS_DELETE: 'registratura.documents.delete',
  DOCUMENTS_MANAGE: 'registratura.documents.manage',

  // General Register
  GENERAL_REGISTER_VIEW: 'registratura.generalRegister.view',
  GENERAL_REGISTER_CREATE: 'registratura.generalRegister.create',
  GENERAL_REGISTER_UPDATE: 'registratura.generalRegister.update',
  GENERAL_REGISTER_DELETE: 'registratura.generalRegister.delete',
  GENERAL_REGISTER_MANAGE: 'registratura.generalRegister.manage',

  // Online Forms
  ONLINE_FORMS_VIEW: 'registratura.onlineForms.view',
  ONLINE_FORMS_CREATE: 'registratura.onlineForms.create',
  ONLINE_FORMS_UPDATE: 'registratura.onlineForms.update',
  ONLINE_FORMS_DELETE: 'registratura.onlineForms.delete',
  ONLINE_FORMS_MANAGE: 'registratura.onlineForms.manage',

  // Mapping Datasets
  MAPPING_DATASETS_VIEW: 'registratura.mappingDatasets.view',
  MAPPING_DATASETS_CREATE: 'registratura.mappingDatasets.create',
  MAPPING_DATASETS_UPDATE: 'registratura.mappingDatasets.update',
  MAPPING_DATASETS_DELETE: 'registratura.mappingDatasets.delete',

  // Register Configurations
  REGISTER_CONFIGURATIONS_VIEW: 'registratura.registerConfigurations.view',
  REGISTER_CONFIGURATIONS_CREATE: 'registratura.registerConfigurations.create',
  REGISTER_CONFIGURATIONS_UPDATE: 'registratura.registerConfigurations.update',
  REGISTER_CONFIGURATIONS_DELETE: 'registratura.registerConfigurations.delete',
} as const;

export type RegistraturaPermission = typeof REGISTRATURA_PERMISSIONS[keyof typeof REGISTRATURA_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Registratura permission
 */
export function isRegistraturaPermission(permission: string): permission is RegistraturaPermission {
  return Object.values(REGISTRATURA_PERMISSIONS).includes(permission as RegistraturaPermission);
}

/**
 * Get all Registratura permissions as an array
 */
export function getAllRegistraturaPermissions(): RegistraturaPermission[] {
  return Object.values(REGISTRATURA_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const REGISTRATURA_PERMISSION_GROUPS = {
  documents: [
    REGISTRATURA_PERMISSIONS.DOCUMENTS_VIEW,
    REGISTRATURA_PERMISSIONS.DOCUMENTS_CREATE,
    REGISTRATURA_PERMISSIONS.DOCUMENTS_UPDATE,
    REGISTRATURA_PERMISSIONS.DOCUMENTS_DELETE,
    REGISTRATURA_PERMISSIONS.DOCUMENTS_MANAGE,
  ],
  generalRegister: [
    REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_VIEW,
    REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_CREATE,
    REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_UPDATE,
    REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_DELETE,
    REGISTRATURA_PERMISSIONS.GENERAL_REGISTER_MANAGE,
  ],
  onlineForms: [
    REGISTRATURA_PERMISSIONS.ONLINE_FORMS_VIEW,
    REGISTRATURA_PERMISSIONS.ONLINE_FORMS_CREATE,
    REGISTRATURA_PERMISSIONS.ONLINE_FORMS_UPDATE,
    REGISTRATURA_PERMISSIONS.ONLINE_FORMS_DELETE,
    REGISTRATURA_PERMISSIONS.ONLINE_FORMS_MANAGE,
  ],
  mappingDatasets: [
    REGISTRATURA_PERMISSIONS.MAPPING_DATASETS_VIEW,
    REGISTRATURA_PERMISSIONS.MAPPING_DATASETS_CREATE,
    REGISTRATURA_PERMISSIONS.MAPPING_DATASETS_UPDATE,
    REGISTRATURA_PERMISSIONS.MAPPING_DATASETS_DELETE,
  ],
  registerConfigurations: [
    REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_VIEW,
    REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_CREATE,
    REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_UPDATE,
    REGISTRATURA_PERMISSIONS.REGISTER_CONFIGURATIONS_DELETE,
  ],
} as const;

