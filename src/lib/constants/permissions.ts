/**
 * Permission resources and actions constants
 * Used for creating and managing permissions in the system
 */

export const PERMISSION_RESOURCES = [
  // Legacy/Generic
  'users', 'roles', 'permissions', 'posts', 'settings', 'reports', 'profile', 'superadmin',
  // Module Resources
  'registratura.documents', 'registratura.generalRegister', 'registratura.onlineForms', 'registratura.mappingDatasets', 'registratura.registerConfigurations',
  'accounting.invoices', 'accounting.contracts', 'accounting.payments', 'accounting.donations', 'accounting.clients', 'accounting.suppliers', 'accounting.warehouses', 'accounting.products', 'accounting.stockMovements', 'accounting.stockLevels', 'accounting.fixedAssets',
  'administration.dioceses', 'administration.deaneries', 'administration.parishes', 'administration.departments', 'administration.users', 'administration.emailTemplates', 'administration.notifications',
  'events', 'events.baptisms', 'events.weddings', 'events.funerals', 'events.documents', 'events.participants',
  'parishioners', 'parishioners.receipts', 'parishioners.contracts', 'parishioners.types', 'parishioners.birthdays', 'parishioners.nameDays',
  'catechesis.classes', 'catechesis.lessons', 'catechesis.students', 'catechesis.enrollments', 'catechesis.progress',
  'pilgrimages', 'pilgrimages.participants', 'pilgrimages.payments', 'pilgrimages.documents', 'pilgrimages.meals', 'pilgrimages.accommodation', 'pilgrimages.transport', 'pilgrimages.schedule', 'pilgrimages.statistics',
  'onlineForms', 'onlineForms.submissions', 'onlineForms.mappingDatasets',
  'pangare', 'pangare.inventar', 'pangare.utilizatori',
  'chat', 'chat.files',
  'analytics', 'analytics.reports',
  'dataStatistics',
  'superadmin.roles', 'superadmin.permissions', 'superadmin.userRoles', 'superadmin.rolePermissions',
] as const;

export const PERMISSION_ACTIONS = [
  'read', 'write', 'delete', 'manage', 'access', 'view', 'create', 'update', 'approve', 'export', 'import'
] as const;

export type PermissionResource = typeof PERMISSION_RESOURCES[number];
export type PermissionAction = typeof PERMISSION_ACTIONS[number];


