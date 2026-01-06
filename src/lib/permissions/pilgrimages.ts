/**
 * Pilgrimages module permission constants
 * 
 * These permissions follow the pattern: pilgrimages.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const PILGRIMAGES_PERMISSIONS = {
  // Pilgrimages (general)
  VIEW: 'pilgrimages.view',
  CREATE: 'pilgrimages.create',
  UPDATE: 'pilgrimages.update',
  DELETE: 'pilgrimages.delete',
  APPROVE: 'pilgrimages.approve',
  PUBLISH: 'pilgrimages.publish',
  CLOSE: 'pilgrimages.close',
  CANCEL: 'pilgrimages.cancel',

  // Participants
  PARTICIPANTS_VIEW: 'pilgrimages.participants.view',
  PARTICIPANTS_CREATE: 'pilgrimages.participants.create',
  PARTICIPANTS_UPDATE: 'pilgrimages.participants.update',
  PARTICIPANTS_DELETE: 'pilgrimages.participants.delete',
  PARTICIPANTS_CONFIRM: 'pilgrimages.participants.confirm',
  PARTICIPANTS_CANCEL: 'pilgrimages.participants.cancel',

  // Payments
  PAYMENTS_VIEW: 'pilgrimages.payments.view',
  PAYMENTS_CREATE: 'pilgrimages.payments.create',
  PAYMENTS_UPDATE: 'pilgrimages.payments.update',
  PAYMENTS_DELETE: 'pilgrimages.payments.delete',

  // Documents
  DOCUMENTS_VIEW: 'pilgrimages.documents.view',
  DOCUMENTS_CREATE: 'pilgrimages.documents.create',
  DOCUMENTS_DELETE: 'pilgrimages.documents.delete',

  // Meals
  MEALS_VIEW: 'pilgrimages.meals.view',
  MEALS_CREATE: 'pilgrimages.meals.create',
  MEALS_UPDATE: 'pilgrimages.meals.update',
  MEALS_DELETE: 'pilgrimages.meals.delete',

  // Accommodation
  ACCOMMODATION_VIEW: 'pilgrimages.accommodation.view',
  ACCOMMODATION_CREATE: 'pilgrimages.accommodation.create',
  ACCOMMODATION_UPDATE: 'pilgrimages.accommodation.update',
  ACCOMMODATION_DELETE: 'pilgrimages.accommodation.delete',

  // Transport
  TRANSPORT_VIEW: 'pilgrimages.transport.view',
  TRANSPORT_CREATE: 'pilgrimages.transport.create',
  TRANSPORT_UPDATE: 'pilgrimages.transport.update',
  TRANSPORT_DELETE: 'pilgrimages.transport.delete',

  // Schedule
  SCHEDULE_VIEW: 'pilgrimages.schedule.view',
  SCHEDULE_CREATE: 'pilgrimages.schedule.create',
  SCHEDULE_UPDATE: 'pilgrimages.schedule.update',
  SCHEDULE_DELETE: 'pilgrimages.schedule.delete',

  // Statistics
  STATISTICS_VIEW: 'pilgrimages.statistics.view',
} as const;

export type PilgrimagesPermission = typeof PILGRIMAGES_PERMISSIONS[keyof typeof PILGRIMAGES_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Pilgrimages permission
 */
export function isPilgrimagesPermission(permission: string): permission is PilgrimagesPermission {
  return Object.values(PILGRIMAGES_PERMISSIONS).includes(permission as PilgrimagesPermission);
}

/**
 * Get all Pilgrimages permissions as an array
 */
export function getAllPilgrimagesPermissions(): PilgrimagesPermission[] {
  return Object.values(PILGRIMAGES_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const PILGRIMAGES_PERMISSION_GROUPS = {
  pilgrimages: [
    PILGRIMAGES_PERMISSIONS.VIEW,
    PILGRIMAGES_PERMISSIONS.CREATE,
    PILGRIMAGES_PERMISSIONS.UPDATE,
    PILGRIMAGES_PERMISSIONS.DELETE,
    PILGRIMAGES_PERMISSIONS.APPROVE,
    PILGRIMAGES_PERMISSIONS.PUBLISH,
    PILGRIMAGES_PERMISSIONS.CLOSE,
    PILGRIMAGES_PERMISSIONS.CANCEL,
  ],
  participants: [
    PILGRIMAGES_PERMISSIONS.PARTICIPANTS_VIEW,
    PILGRIMAGES_PERMISSIONS.PARTICIPANTS_CREATE,
    PILGRIMAGES_PERMISSIONS.PARTICIPANTS_UPDATE,
    PILGRIMAGES_PERMISSIONS.PARTICIPANTS_DELETE,
    PILGRIMAGES_PERMISSIONS.PARTICIPANTS_CONFIRM,
    PILGRIMAGES_PERMISSIONS.PARTICIPANTS_CANCEL,
  ],
  payments: [
    PILGRIMAGES_PERMISSIONS.PAYMENTS_VIEW,
    PILGRIMAGES_PERMISSIONS.PAYMENTS_CREATE,
    PILGRIMAGES_PERMISSIONS.PAYMENTS_UPDATE,
    PILGRIMAGES_PERMISSIONS.PAYMENTS_DELETE,
  ],
  documents: [
    PILGRIMAGES_PERMISSIONS.DOCUMENTS_VIEW,
    PILGRIMAGES_PERMISSIONS.DOCUMENTS_CREATE,
    PILGRIMAGES_PERMISSIONS.DOCUMENTS_DELETE,
  ],
  meals: [
    PILGRIMAGES_PERMISSIONS.MEALS_VIEW,
    PILGRIMAGES_PERMISSIONS.MEALS_CREATE,
    PILGRIMAGES_PERMISSIONS.MEALS_UPDATE,
    PILGRIMAGES_PERMISSIONS.MEALS_DELETE,
  ],
  accommodation: [
    PILGRIMAGES_PERMISSIONS.ACCOMMODATION_VIEW,
    PILGRIMAGES_PERMISSIONS.ACCOMMODATION_CREATE,
    PILGRIMAGES_PERMISSIONS.ACCOMMODATION_UPDATE,
    PILGRIMAGES_PERMISSIONS.ACCOMMODATION_DELETE,
  ],
  transport: [
    PILGRIMAGES_PERMISSIONS.TRANSPORT_VIEW,
    PILGRIMAGES_PERMISSIONS.TRANSPORT_CREATE,
    PILGRIMAGES_PERMISSIONS.TRANSPORT_UPDATE,
    PILGRIMAGES_PERMISSIONS.TRANSPORT_DELETE,
  ],
  schedule: [
    PILGRIMAGES_PERMISSIONS.SCHEDULE_VIEW,
    PILGRIMAGES_PERMISSIONS.SCHEDULE_CREATE,
    PILGRIMAGES_PERMISSIONS.SCHEDULE_UPDATE,
    PILGRIMAGES_PERMISSIONS.SCHEDULE_DELETE,
  ],
  statistics: [
    PILGRIMAGES_PERMISSIONS.STATISTICS_VIEW,
  ],
} as const;






