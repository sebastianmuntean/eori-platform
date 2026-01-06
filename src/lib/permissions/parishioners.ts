/**
 * Parishioners module permission constants
 * 
 * These permissions follow the pattern: parishioners.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const PARISHIONERS_PERMISSIONS = {
  // Parishioners (general)
  VIEW: 'parishioners.view',
  CREATE: 'parishioners.create',
  UPDATE: 'parishioners.update',
  DELETE: 'parishioners.delete',
  SEARCH: 'parishioners.search',

  // Receipts
  RECEIPTS_VIEW: 'parishioners.receipts.view',
  RECEIPTS_CREATE: 'parishioners.receipts.create',
  RECEIPTS_UPDATE: 'parishioners.receipts.update',
  RECEIPTS_DELETE: 'parishioners.receipts.delete',
  RECEIPTS_PRINT: 'parishioners.receipts.print',

  // Contracts
  CONTRACTS_VIEW: 'parishioners.contracts.view',
  CONTRACTS_CREATE: 'parishioners.contracts.create',
  CONTRACTS_UPDATE: 'parishioners.contracts.update',
  CONTRACTS_DELETE: 'parishioners.contracts.delete',
  CONTRACTS_RENEW: 'parishioners.contracts.renew',
  CONTRACTS_TERMINATE: 'parishioners.contracts.terminate',

  // Types
  TYPES_VIEW: 'parishioners.types.view',
  TYPES_CREATE: 'parishioners.types.create',
  TYPES_UPDATE: 'parishioners.types.update',
  TYPES_DELETE: 'parishioners.types.delete',

  // Birthdays
  BIRTHDAYS_VIEW: 'parishioners.birthdays.view',

  // Name Days
  NAME_DAYS_VIEW: 'parishioners.nameDays.view',
} as const;

export type ParishionersPermission = typeof PARISHIONERS_PERMISSIONS[keyof typeof PARISHIONERS_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Parishioners permission
 */
export function isParishionersPermission(permission: string): permission is ParishionersPermission {
  return Object.values(PARISHIONERS_PERMISSIONS).includes(permission as ParishionersPermission);
}

/**
 * Get all Parishioners permissions as an array
 */
export function getAllParishionersPermissions(): ParishionersPermission[] {
  return Object.values(PARISHIONERS_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const PARISHIONERS_PERMISSION_GROUPS = {
  parishioners: [
    PARISHIONERS_PERMISSIONS.VIEW,
    PARISHIONERS_PERMISSIONS.CREATE,
    PARISHIONERS_PERMISSIONS.UPDATE,
    PARISHIONERS_PERMISSIONS.DELETE,
    PARISHIONERS_PERMISSIONS.SEARCH,
  ],
  receipts: [
    PARISHIONERS_PERMISSIONS.RECEIPTS_VIEW,
    PARISHIONERS_PERMISSIONS.RECEIPTS_CREATE,
    PARISHIONERS_PERMISSIONS.RECEIPTS_UPDATE,
    PARISHIONERS_PERMISSIONS.RECEIPTS_DELETE,
    PARISHIONERS_PERMISSIONS.RECEIPTS_PRINT,
  ],
  contracts: [
    PARISHIONERS_PERMISSIONS.CONTRACTS_VIEW,
    PARISHIONERS_PERMISSIONS.CONTRACTS_CREATE,
    PARISHIONERS_PERMISSIONS.CONTRACTS_UPDATE,
    PARISHIONERS_PERMISSIONS.CONTRACTS_DELETE,
    PARISHIONERS_PERMISSIONS.CONTRACTS_RENEW,
    PARISHIONERS_PERMISSIONS.CONTRACTS_TERMINATE,
  ],
  types: [
    PARISHIONERS_PERMISSIONS.TYPES_VIEW,
    PARISHIONERS_PERMISSIONS.TYPES_CREATE,
    PARISHIONERS_PERMISSIONS.TYPES_UPDATE,
    PARISHIONERS_PERMISSIONS.TYPES_DELETE,
  ],
  birthdays: [
    PARISHIONERS_PERMISSIONS.BIRTHDAYS_VIEW,
  ],
  nameDays: [
    PARISHIONERS_PERMISSIONS.NAME_DAYS_VIEW,
  ],
} as const;






