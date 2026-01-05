/**
 * Events module permission constants
 * 
 * These permissions follow the pattern: events.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const EVENTS_PERMISSIONS = {
  // Events (general)
  VIEW: 'events.view',
  CREATE: 'events.create',
  UPDATE: 'events.update',
  DELETE: 'events.delete',
  CANCEL: 'events.cancel',
  CONFIRM: 'events.confirm',

  // Baptisms
  BAPTISMS_VIEW: 'events.baptisms.view',
  BAPTISMS_CREATE: 'events.baptisms.create',
  BAPTISMS_UPDATE: 'events.baptisms.update',
  BAPTISMS_DELETE: 'events.baptisms.delete',

  // Weddings
  WEDDINGS_VIEW: 'events.weddings.view',
  WEDDINGS_CREATE: 'events.weddings.create',
  WEDDINGS_UPDATE: 'events.weddings.update',
  WEDDINGS_DELETE: 'events.weddings.delete',

  // Funerals
  FUNERALS_VIEW: 'events.funerals.view',
  FUNERALS_CREATE: 'events.funerals.create',
  FUNERALS_UPDATE: 'events.funerals.update',
  FUNERALS_DELETE: 'events.funerals.delete',

  // Documents
  DOCUMENTS_VIEW: 'events.documents.view',
  DOCUMENTS_CREATE: 'events.documents.create',
  DOCUMENTS_DELETE: 'events.documents.delete',

  // Participants
  PARTICIPANTS_VIEW: 'events.participants.view',
  PARTICIPANTS_CREATE: 'events.participants.create',
  PARTICIPANTS_UPDATE: 'events.participants.update',
  PARTICIPANTS_DELETE: 'events.participants.delete',
} as const;

export type EventsPermission = typeof EVENTS_PERMISSIONS[keyof typeof EVENTS_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Events permission
 */
export function isEventsPermission(permission: string): permission is EventsPermission {
  return Object.values(EVENTS_PERMISSIONS).includes(permission as EventsPermission);
}

/**
 * Get all Events permissions as an array
 */
export function getAllEventsPermissions(): EventsPermission[] {
  return Object.values(EVENTS_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const EVENTS_PERMISSION_GROUPS = {
  events: [
    EVENTS_PERMISSIONS.VIEW,
    EVENTS_PERMISSIONS.CREATE,
    EVENTS_PERMISSIONS.UPDATE,
    EVENTS_PERMISSIONS.DELETE,
    EVENTS_PERMISSIONS.CANCEL,
    EVENTS_PERMISSIONS.CONFIRM,
  ],
  baptisms: [
    EVENTS_PERMISSIONS.BAPTISMS_VIEW,
    EVENTS_PERMISSIONS.BAPTISMS_CREATE,
    EVENTS_PERMISSIONS.BAPTISMS_UPDATE,
    EVENTS_PERMISSIONS.BAPTISMS_DELETE,
  ],
  weddings: [
    EVENTS_PERMISSIONS.WEDDINGS_VIEW,
    EVENTS_PERMISSIONS.WEDDINGS_CREATE,
    EVENTS_PERMISSIONS.WEDDINGS_UPDATE,
    EVENTS_PERMISSIONS.WEDDINGS_DELETE,
  ],
  funerals: [
    EVENTS_PERMISSIONS.FUNERALS_VIEW,
    EVENTS_PERMISSIONS.FUNERALS_CREATE,
    EVENTS_PERMISSIONS.FUNERALS_UPDATE,
    EVENTS_PERMISSIONS.FUNERALS_DELETE,
  ],
  documents: [
    EVENTS_PERMISSIONS.DOCUMENTS_VIEW,
    EVENTS_PERMISSIONS.DOCUMENTS_CREATE,
    EVENTS_PERMISSIONS.DOCUMENTS_DELETE,
  ],
  participants: [
    EVENTS_PERMISSIONS.PARTICIPANTS_VIEW,
    EVENTS_PERMISSIONS.PARTICIPANTS_CREATE,
    EVENTS_PERMISSIONS.PARTICIPANTS_UPDATE,
    EVENTS_PERMISSIONS.PARTICIPANTS_DELETE,
  ],
} as const;


