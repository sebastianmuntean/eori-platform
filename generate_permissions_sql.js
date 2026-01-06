const fs = require('fs');
const path = require('path');

// Map of permission name to display name and description
const permissions = {
  // Accounting
  'accounting.invoices.view': { display: 'View Invoices', desc: 'View invoices' },
  'accounting.invoices.create': { display: 'Create Invoices', desc: 'Create invoices' },
  'accounting.invoices.update': { display: 'Update Invoices', desc: 'Update invoices' },
  'accounting.invoices.delete': { display: 'Delete Invoices', desc: 'Delete invoices' },
  'accounting.invoices.approve': { display: 'Approve Invoices', desc: 'Approve invoices' },
  'accounting.invoices.pay': { display: 'Pay Invoices', desc: 'Pay invoices' },
  'accounting.invoices.export': { display: 'Export Invoices', desc: 'Export invoices' },
  'accounting.contracts.view': { display: 'View Contracts', desc: 'View contracts' },
  'accounting.contracts.create': { display: 'Create Contracts', desc: 'Create contracts' },
  'accounting.contracts.update': { display: 'Update Contracts', desc: 'Update contracts' },
  'accounting.contracts.delete': { display: 'Delete Contracts', desc: 'Delete contracts' },
  'accounting.contracts.renew': { display: 'Renew Contracts', desc: 'Renew contracts' },
  'accounting.contracts.terminate': { display: 'Terminate Contracts', desc: 'Terminate contracts' },
  'accounting.payments.view': { display: 'View Payments', desc: 'View payments' },
  'accounting.payments.create': { display: 'Create Payments', desc: 'Create payments' },
  'accounting.payments.update': { display: 'Update Payments', desc: 'Update payments' },
  'accounting.payments.delete': { display: 'Delete Payments', desc: 'Delete payments' },
  'accounting.payments.approve': { display: 'Approve Payments', desc: 'Approve payments' },
  'accounting.donations.view': { display: 'View Donations', desc: 'View donations' },
  'accounting.donations.create': { display: 'Create Donations', desc: 'Create donations' },
  'accounting.donations.update': { display: 'Update Donations', desc: 'Update donations' },
  'accounting.donations.delete': { display: 'Delete Donations', desc: 'Delete donations' },
  'accounting.clients.view': { display: 'View Clients', desc: 'View clients' },
  'accounting.clients.create': { display: 'Create Clients', desc: 'Create clients' },
  'accounting.clients.update': { display: 'Update Clients', desc: 'Update clients' },
  'accounting.clients.delete': { display: 'Delete Clients', desc: 'Delete clients' },
  'accounting.clients.viewStatement': { display: 'View Client Statements', desc: 'View client statements' },
  'accounting.suppliers.view': { display: 'View Suppliers', desc: 'View suppliers' },
  'accounting.suppliers.create': { display: 'Create Suppliers', desc: 'Create suppliers' },
  'accounting.suppliers.update': { display: 'Update Suppliers', desc: 'Update suppliers' },
  'accounting.suppliers.delete': { display: 'Delete Suppliers', desc: 'Delete suppliers' },
  'accounting.warehouses.view': { display: 'View Warehouses', desc: 'View warehouses' },
  'accounting.warehouses.create': { display: 'Create Warehouses', desc: 'Create warehouses' },
  'accounting.warehouses.update': { display: 'Update Warehouses', desc: 'Update warehouses' },
  'accounting.warehouses.delete': { display: 'Delete Warehouses', desc: 'Delete warehouses' },
  'accounting.products.view': { display: 'View Products', desc: 'View products' },
  'accounting.products.create': { display: 'Create Products', desc: 'Create products' },
  'accounting.products.update': { display: 'Update Products', desc: 'Update products' },
  'accounting.products.delete': { display: 'Delete Products', desc: 'Delete products' },
  'accounting.stockMovements.view': { display: 'View Stock Movements', desc: 'View stock movements' },
  'accounting.stockMovements.create': { display: 'Create Stock Movements', desc: 'Create stock movements' },
  'accounting.stockMovements.update': { display: 'Update Stock Movements', desc: 'Update stock movements' },
  'accounting.stockMovements.delete': { display: 'Delete Stock Movements', desc: 'Delete stock movements' },
  'accounting.stockMovements.transfer': { display: 'Transfer Stock Movements', desc: 'Transfer stock movements' },
  'accounting.stockLevels.view': { display: 'View Stock Levels', desc: 'View stock levels' },
  'accounting.stockLevels.export': { display: 'Export Stock Levels', desc: 'Export stock levels' },
  'accounting.fixedAssets.view': { display: 'View Fixed Assets', desc: 'View fixed assets' },
  'accounting.fixedAssets.create': { display: 'Create Fixed Assets', desc: 'Create fixed assets' },
  'accounting.fixedAssets.update': { display: 'Update Fixed Assets', desc: 'Update fixed assets' },
  'accounting.fixedAssets.delete': { display: 'Delete Fixed Assets', desc: 'Delete fixed assets' },
  'accounting.fixedAssets.manage': { display: 'Manage Fixed Assets', desc: 'Manage fixed assets' },
};

console.log('This script would generate SQL, but it\'s better to create the SQL directly.');






