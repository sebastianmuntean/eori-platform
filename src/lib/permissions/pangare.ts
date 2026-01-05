/**
 * Pangare module permission constants (Inventory Management)
 * 
 * These permissions follow the pattern: pangare.{resource}.{action}
 * All permissions are defined in the database migration
 * 
 * Note: Products, Warehouses, Stock Movements, Stock Levels, and Fixed Assets
 * are shared with Accounting module and use accounting.* permissions
 */

export const PANGARE_PERMISSIONS = {
  // Pangare (general)
  VIEW: 'pangare.view',

  // Inventar
  INVENTAR_VIEW: 'pangare.inventar.view',
  INVENTAR_CREATE: 'pangare.inventar.create',
  INVENTAR_UPDATE: 'pangare.inventar.update',
  INVENTAR_DELETE: 'pangare.inventar.delete',

  // Utilizatori
  UTILIZATORI_VIEW: 'pangare.utilizatori.view',
  UTILIZATORI_CREATE: 'pangare.utilizatori.create',
  UTILIZATORI_UPDATE: 'pangare.utilizatori.update',
  UTILIZATORI_DELETE: 'pangare.utilizatori.delete',
} as const;

export type PangarePermission = typeof PANGARE_PERMISSIONS[keyof typeof PANGARE_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Pangare permission
 */
export function isPangarePermission(permission: string): permission is PangarePermission {
  return Object.values(PANGARE_PERMISSIONS).includes(permission as PangarePermission);
}

/**
 * Get all Pangare permissions as an array
 */
export function getAllPangarePermissions(): PangarePermission[] {
  return Object.values(PANGARE_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const PANGARE_PERMISSION_GROUPS = {
  pangare: [
    PANGARE_PERMISSIONS.VIEW,
  ],
  inventar: [
    PANGARE_PERMISSIONS.INVENTAR_VIEW,
    PANGARE_PERMISSIONS.INVENTAR_CREATE,
    PANGARE_PERMISSIONS.INVENTAR_UPDATE,
    PANGARE_PERMISSIONS.INVENTAR_DELETE,
  ],
  utilizatori: [
    PANGARE_PERMISSIONS.UTILIZATORI_VIEW,
    PANGARE_PERMISSIONS.UTILIZATORI_CREATE,
    PANGARE_PERMISSIONS.UTILIZATORI_UPDATE,
    PANGARE_PERMISSIONS.UTILIZATORI_DELETE,
  ],
} as const;


