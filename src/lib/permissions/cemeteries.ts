/**
 * Cemetery-related permission constants
 * 
 * These permissions follow the pattern: resource.action
 * where resource can be nested (e.g., cemeteries.burials)
 */
export const CEMETERY_PERMISSIONS = {
  // Cemetery CRUD
  CEMETERIES_CREATE: 'cemeteries.create',
  CEMETERIES_UPDATE: 'cemeteries.update',
  CEMETERIES_DELETE: 'cemeteries.delete',
  CEMETERIES_READ: 'cemeteries.read',
  
  // Parcels
  PARCELS_CREATE: 'cemeteries.parcels.create',
  PARCELS_UPDATE: 'cemeteries.parcels.update',
  PARCELS_DELETE: 'cemeteries.parcels.delete',
  
  // Rows
  ROWS_CREATE: 'cemeteries.rows.create',
  ROWS_UPDATE: 'cemeteries.rows.update',
  ROWS_DELETE: 'cemeteries.rows.delete',
  
  // Graves
  GRAVES_CREATE: 'cemeteries.graves.create',
  GRAVES_UPDATE: 'cemeteries.graves.update',
  GRAVES_DELETE: 'cemeteries.graves.delete',
  
  // Burials
  BURIALS_CREATE: 'cemeteries.burials.create',
  BURIALS_UPDATE: 'cemeteries.burials.update',
  BURIALS_DELETE: 'cemeteries.burials.delete',
  
  // Concessions
  CONCESSIONS_CREATE: 'cemeteries.concessions.create',
  CONCESSIONS_UPDATE: 'cemeteries.concessions.update',
  CONCESSIONS_DELETE: 'cemeteries.concessions.delete',
  
  // Concession Payments
  CONCESSION_PAYMENTS_CREATE: 'cemeteries.concessions.payments.create',
  CONCESSION_PAYMENTS_UPDATE: 'cemeteries.concessions.payments.update',
  CONCESSION_PAYMENTS_DELETE: 'cemeteries.concessions.payments.delete',
} as const;

export type CemeteryPermission = typeof CEMETERY_PERMISSIONS[keyof typeof CEMETERY_PERMISSIONS];



