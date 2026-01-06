/**
 * Accounting module permission constants
 * 
 * These permissions follow the pattern: accounting.{resource}.{action}
 * All permissions are defined in the database migration
 */

export const ACCOUNTING_PERMISSIONS = {
  // Invoices
  INVOICES_VIEW: 'accounting.invoices.view',
  INVOICES_CREATE: 'accounting.invoices.create',
  INVOICES_UPDATE: 'accounting.invoices.update',
  INVOICES_DELETE: 'accounting.invoices.delete',
  INVOICES_APPROVE: 'accounting.invoices.approve',
  INVOICES_PAY: 'accounting.invoices.pay',
  INVOICES_EXPORT: 'accounting.invoices.export',

  // Contracts
  CONTRACTS_VIEW: 'accounting.contracts.view',
  CONTRACTS_CREATE: 'accounting.contracts.create',
  CONTRACTS_UPDATE: 'accounting.contracts.update',
  CONTRACTS_DELETE: 'accounting.contracts.delete',
  CONTRACTS_RENEW: 'accounting.contracts.renew',
  CONTRACTS_TERMINATE: 'accounting.contracts.terminate',

  // Payments
  PAYMENTS_VIEW: 'accounting.payments.view',
  PAYMENTS_CREATE: 'accounting.payments.create',
  PAYMENTS_UPDATE: 'accounting.payments.update',
  PAYMENTS_DELETE: 'accounting.payments.delete',
  PAYMENTS_APPROVE: 'accounting.payments.approve',

  // Donations
  DONATIONS_VIEW: 'accounting.donations.view',
  DONATIONS_CREATE: 'accounting.donations.create',
  DONATIONS_UPDATE: 'accounting.donations.update',
  DONATIONS_DELETE: 'accounting.donations.delete',

  // Clients
  CLIENTS_VIEW: 'accounting.clients.view',
  CLIENTS_CREATE: 'accounting.clients.create',
  CLIENTS_UPDATE: 'accounting.clients.update',
  CLIENTS_DELETE: 'accounting.clients.delete',
  CLIENTS_VIEW_STATEMENT: 'accounting.clients.viewStatement',

  // Suppliers
  SUPPLIERS_VIEW: 'accounting.suppliers.view',
  SUPPLIERS_CREATE: 'accounting.suppliers.create',
  SUPPLIERS_UPDATE: 'accounting.suppliers.update',
  SUPPLIERS_DELETE: 'accounting.suppliers.delete',

  // Warehouses
  WAREHOUSES_VIEW: 'accounting.warehouses.view',
  WAREHOUSES_CREATE: 'accounting.warehouses.create',
  WAREHOUSES_UPDATE: 'accounting.warehouses.update',
  WAREHOUSES_DELETE: 'accounting.warehouses.delete',

  // Products
  PRODUCTS_VIEW: 'accounting.products.view',
  PRODUCTS_CREATE: 'accounting.products.create',
  PRODUCTS_UPDATE: 'accounting.products.update',
  PRODUCTS_DELETE: 'accounting.products.delete',

  // Stock Movements
  STOCK_MOVEMENTS_VIEW: 'accounting.stockMovements.view',
  STOCK_MOVEMENTS_CREATE: 'accounting.stockMovements.create',
  STOCK_MOVEMENTS_UPDATE: 'accounting.stockMovements.update',
  STOCK_MOVEMENTS_DELETE: 'accounting.stockMovements.delete',
  STOCK_MOVEMENTS_TRANSFER: 'accounting.stockMovements.transfer',

  // Stock Levels
  STOCK_LEVELS_VIEW: 'accounting.stockLevels.view',
  STOCK_LEVELS_EXPORT: 'accounting.stockLevels.export',

  // Fixed Assets
  FIXED_ASSETS_VIEW: 'accounting.fixedAssets.view',
  FIXED_ASSETS_CREATE: 'accounting.fixedAssets.create',
  FIXED_ASSETS_UPDATE: 'accounting.fixedAssets.update',
  FIXED_ASSETS_DELETE: 'accounting.fixedAssets.delete',
  FIXED_ASSETS_MANAGE: 'accounting.fixedAssets.manage',
} as const;

export type AccountingPermission = typeof ACCOUNTING_PERMISSIONS[keyof typeof ACCOUNTING_PERMISSIONS];

/**
 * Helper function to check if a permission string is a valid Accounting permission
 */
export function isAccountingPermission(permission: string): permission is AccountingPermission {
  return Object.values(ACCOUNTING_PERMISSIONS).includes(permission as AccountingPermission);
}

/**
 * Get all Accounting permissions as an array
 */
export function getAllAccountingPermissions(): AccountingPermission[] {
  return Object.values(ACCOUNTING_PERMISSIONS);
}

/**
 * Permission groups for easier management
 */
export const ACCOUNTING_PERMISSION_GROUPS = {
  invoices: [
    ACCOUNTING_PERMISSIONS.INVOICES_VIEW,
    ACCOUNTING_PERMISSIONS.INVOICES_CREATE,
    ACCOUNTING_PERMISSIONS.INVOICES_UPDATE,
    ACCOUNTING_PERMISSIONS.INVOICES_DELETE,
    ACCOUNTING_PERMISSIONS.INVOICES_APPROVE,
    ACCOUNTING_PERMISSIONS.INVOICES_PAY,
    ACCOUNTING_PERMISSIONS.INVOICES_EXPORT,
  ],
  contracts: [
    ACCOUNTING_PERMISSIONS.CONTRACTS_VIEW,
    ACCOUNTING_PERMISSIONS.CONTRACTS_CREATE,
    ACCOUNTING_PERMISSIONS.CONTRACTS_UPDATE,
    ACCOUNTING_PERMISSIONS.CONTRACTS_DELETE,
    ACCOUNTING_PERMISSIONS.CONTRACTS_RENEW,
    ACCOUNTING_PERMISSIONS.CONTRACTS_TERMINATE,
  ],
  payments: [
    ACCOUNTING_PERMISSIONS.PAYMENTS_VIEW,
    ACCOUNTING_PERMISSIONS.PAYMENTS_CREATE,
    ACCOUNTING_PERMISSIONS.PAYMENTS_UPDATE,
    ACCOUNTING_PERMISSIONS.PAYMENTS_DELETE,
    ACCOUNTING_PERMISSIONS.PAYMENTS_APPROVE,
  ],
  donations: [
    ACCOUNTING_PERMISSIONS.DONATIONS_VIEW,
    ACCOUNTING_PERMISSIONS.DONATIONS_CREATE,
    ACCOUNTING_PERMISSIONS.DONATIONS_UPDATE,
    ACCOUNTING_PERMISSIONS.DONATIONS_DELETE,
  ],
  clients: [
    ACCOUNTING_PERMISSIONS.CLIENTS_VIEW,
    ACCOUNTING_PERMISSIONS.CLIENTS_CREATE,
    ACCOUNTING_PERMISSIONS.CLIENTS_UPDATE,
    ACCOUNTING_PERMISSIONS.CLIENTS_DELETE,
    ACCOUNTING_PERMISSIONS.CLIENTS_VIEW_STATEMENT,
  ],
  suppliers: [
    ACCOUNTING_PERMISSIONS.SUPPLIERS_VIEW,
    ACCOUNTING_PERMISSIONS.SUPPLIERS_CREATE,
    ACCOUNTING_PERMISSIONS.SUPPLIERS_UPDATE,
    ACCOUNTING_PERMISSIONS.SUPPLIERS_DELETE,
  ],
  warehouses: [
    ACCOUNTING_PERMISSIONS.WAREHOUSES_VIEW,
    ACCOUNTING_PERMISSIONS.WAREHOUSES_CREATE,
    ACCOUNTING_PERMISSIONS.WAREHOUSES_UPDATE,
    ACCOUNTING_PERMISSIONS.WAREHOUSES_DELETE,
  ],
  products: [
    ACCOUNTING_PERMISSIONS.PRODUCTS_VIEW,
    ACCOUNTING_PERMISSIONS.PRODUCTS_CREATE,
    ACCOUNTING_PERMISSIONS.PRODUCTS_UPDATE,
    ACCOUNTING_PERMISSIONS.PRODUCTS_DELETE,
  ],
  stockMovements: [
    ACCOUNTING_PERMISSIONS.STOCK_MOVEMENTS_VIEW,
    ACCOUNTING_PERMISSIONS.STOCK_MOVEMENTS_CREATE,
    ACCOUNTING_PERMISSIONS.STOCK_MOVEMENTS_UPDATE,
    ACCOUNTING_PERMISSIONS.STOCK_MOVEMENTS_DELETE,
    ACCOUNTING_PERMISSIONS.STOCK_MOVEMENTS_TRANSFER,
  ],
  stockLevels: [
    ACCOUNTING_PERMISSIONS.STOCK_LEVELS_VIEW,
    ACCOUNTING_PERMISSIONS.STOCK_LEVELS_EXPORT,
  ],
  fixedAssets: [
    ACCOUNTING_PERMISSIONS.FIXED_ASSETS_VIEW,
    ACCOUNTING_PERMISSIONS.FIXED_ASSETS_CREATE,
    ACCOUNTING_PERMISSIONS.FIXED_ASSETS_UPDATE,
    ACCOUNTING_PERMISSIONS.FIXED_ASSETS_DELETE,
    ACCOUNTING_PERMISSIONS.FIXED_ASSETS_MANAGE,
  ],
} as const;






