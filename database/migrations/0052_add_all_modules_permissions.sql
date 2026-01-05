-- Migration: Add permissions for all modules
-- This migration adds all RBAC permissions for all modules in the system
-- Excludes HR permissions (already added in 0049_add_hr_permissions.sql) and Cemeteries (already exists)

-- Note: This migration uses ON CONFLICT DO NOTHING to be idempotent
-- If permissions already exist, they will be skipped

-- ============================================
-- REGISTRATURA MODULE PERMISSIONS
-- ============================================

-- Documents
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.documents.view', 'View Documents', 'View documents', 'registratura.documents', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.documents.create', 'Create Documents', 'Create documents', 'registratura.documents', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.documents.update', 'Update Documents', 'Update documents', 'registratura.documents', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.documents.delete', 'Delete Documents', 'Delete documents', 'registratura.documents', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.documents.manage', 'Manage Documents', 'Manage documents', 'registratura.documents', 'manage')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- General Register
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.generalRegister.view', 'View General Register', 'View general register', 'registratura.generalRegister', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.generalRegister.create', 'Create General Register', 'Create general register', 'registratura.generalRegister', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.generalRegister.update', 'Update General Register', 'Update general register', 'registratura.generalRegister', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.generalRegister.delete', 'Delete General Register', 'Delete general register', 'registratura.generalRegister', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.generalRegister.manage', 'Manage General Register', 'Manage general register', 'registratura.generalRegister', 'manage')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Online Forms
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.onlineForms.view', 'View Online Forms', 'View online forms', 'registratura.onlineForms', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.onlineForms.create', 'Create Online Forms', 'Create online forms', 'registratura.onlineForms', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.onlineForms.update', 'Update Online Forms', 'Update online forms', 'registratura.onlineForms', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.onlineForms.delete', 'Delete Online Forms', 'Delete online forms', 'registratura.onlineForms', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.onlineForms.manage', 'Manage Online Forms', 'Manage online forms', 'registratura.onlineForms', 'manage')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Mapping Datasets
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.mappingDatasets.view', 'View Mapping Datasets', 'View mapping datasets', 'registratura.mappingDatasets', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.mappingDatasets.create', 'Create Mapping Datasets', 'Create mapping datasets', 'registratura.mappingDatasets', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.mappingDatasets.update', 'Update Mapping Datasets', 'Update mapping datasets', 'registratura.mappingDatasets', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.mappingDatasets.delete', 'Delete Mapping Datasets', 'Delete mapping datasets', 'registratura.mappingDatasets', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Register Configurations
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.registerConfigurations.view', 'View Register Configurations', 'View register configurations', 'registratura.registerConfigurations', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.registerConfigurations.create', 'Create Register Configurations', 'Create register configurations', 'registratura.registerConfigurations', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.registerConfigurations.update', 'Update Register Configurations', 'Update register configurations', 'registratura.registerConfigurations', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('registratura.registerConfigurations.delete', 'Delete Register Configurations', 'Delete register configurations', 'registratura.registerConfigurations', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- ACCOUNTING MODULE PERMISSIONS
-- ============================================

-- Invoices
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.invoices.view', 'View Invoices', 'View invoices', 'accounting.invoices', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.invoices.create', 'Create Invoices', 'Create invoices', 'accounting.invoices', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.invoices.update', 'Update Invoices', 'Update invoices', 'accounting.invoices', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.invoices.delete', 'Delete Invoices', 'Delete invoices', 'accounting.invoices', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.invoices.approve', 'Approve Invoices', 'Approve invoices', 'accounting.invoices', 'approve')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.invoices.pay', 'Pay Invoices', 'Pay invoices', 'accounting.invoices', 'pay')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.invoices.export', 'Export Invoices', 'Export invoices', 'accounting.invoices', 'export')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Contracts
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.contracts.view', 'View Contracts', 'View contracts', 'accounting.contracts', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.contracts.create', 'Create Contracts', 'Create contracts', 'accounting.contracts', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.contracts.update', 'Update Contracts', 'Update contracts', 'accounting.contracts', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.contracts.delete', 'Delete Contracts', 'Delete contracts', 'accounting.contracts', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.contracts.renew', 'Renew Contracts', 'Renew contracts', 'accounting.contracts', 'renew')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.contracts.terminate', 'Terminate Contracts', 'Terminate contracts', 'accounting.contracts', 'terminate')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Payments
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.payments.view', 'View Payments', 'View payments', 'accounting.payments', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.payments.create', 'Create Payments', 'Create payments', 'accounting.payments', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.payments.update', 'Update Payments', 'Update payments', 'accounting.payments', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.payments.delete', 'Delete Payments', 'Delete payments', 'accounting.payments', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.payments.approve', 'Approve Payments', 'Approve payments', 'accounting.payments', 'approve')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Donations
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.donations.view', 'View Donations', 'View donations', 'accounting.donations', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.donations.create', 'Create Donations', 'Create donations', 'accounting.donations', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.donations.update', 'Update Donations', 'Update donations', 'accounting.donations', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.donations.delete', 'Delete Donations', 'Delete donations', 'accounting.donations', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Clients
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.clients.view', 'View Clients', 'View clients', 'accounting.clients', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.clients.create', 'Create Clients', 'Create clients', 'accounting.clients', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.clients.update', 'Update Clients', 'Update clients', 'accounting.clients', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.clients.delete', 'Delete Clients', 'Delete clients', 'accounting.clients', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.clients.viewStatement', 'View Client Statements', 'View client statements', 'accounting.clients', 'viewStatement')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Suppliers
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.suppliers.view', 'View Suppliers', 'View suppliers', 'accounting.suppliers', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.suppliers.create', 'Create Suppliers', 'Create suppliers', 'accounting.suppliers', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.suppliers.update', 'Update Suppliers', 'Update suppliers', 'accounting.suppliers', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.suppliers.delete', 'Delete Suppliers', 'Delete suppliers', 'accounting.suppliers', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Warehouses
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.warehouses.view', 'View Warehouses', 'View warehouses', 'accounting.warehouses', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.warehouses.create', 'Create Warehouses', 'Create warehouses', 'accounting.warehouses', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.warehouses.update', 'Update Warehouses', 'Update warehouses', 'accounting.warehouses', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.warehouses.delete', 'Delete Warehouses', 'Delete warehouses', 'accounting.warehouses', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Products
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.products.view', 'View Products', 'View products', 'accounting.products', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.products.create', 'Create Products', 'Create products', 'accounting.products', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.products.update', 'Update Products', 'Update products', 'accounting.products', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.products.delete', 'Delete Products', 'Delete products', 'accounting.products', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Stock Movements
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.stockMovements.view', 'View Stock Movements', 'View stock movements', 'accounting.stockMovements', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.stockMovements.create', 'Create Stock Movements', 'Create stock movements', 'accounting.stockMovements', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.stockMovements.update', 'Update Stock Movements', 'Update stock movements', 'accounting.stockMovements', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.stockMovements.delete', 'Delete Stock Movements', 'Delete stock movements', 'accounting.stockMovements', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.stockMovements.transfer', 'Transfer Stock Movements', 'Transfer stock movements', 'accounting.stockMovements', 'transfer')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Stock Levels
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.stockLevels.view', 'View Stock Levels', 'View stock levels', 'accounting.stockLevels', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.stockLevels.export', 'Export Stock Levels', 'Export stock levels', 'accounting.stockLevels', 'export')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Fixed Assets
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.fixedAssets.view', 'View Fixed Assets', 'View fixed assets', 'accounting.fixedAssets', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.fixedAssets.create', 'Create Fixed Assets', 'Create fixed assets', 'accounting.fixedAssets', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.fixedAssets.update', 'Update Fixed Assets', 'Update fixed assets', 'accounting.fixedAssets', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.fixedAssets.delete', 'Delete Fixed Assets', 'Delete fixed assets', 'accounting.fixedAssets', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('accounting.fixedAssets.manage', 'Manage Fixed Assets', 'Manage fixed assets', 'accounting.fixedAssets', 'manage')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- ADMINISTRATION MODULE PERMISSIONS
-- ============================================

-- Dioceses
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.dioceses.view', 'View Dioceses', 'View dioceses', 'administration.dioceses', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.dioceses.create', 'Create Dioceses', 'Create dioceses', 'administration.dioceses', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.dioceses.update', 'Update Dioceses', 'Update dioceses', 'administration.dioceses', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.dioceses.delete', 'Delete Dioceses', 'Delete dioceses', 'administration.dioceses', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Deaneries
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.deaneries.view', 'View Deaneries', 'View deaneries', 'administration.deaneries', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.deaneries.create', 'Create Deaneries', 'Create deaneries', 'administration.deaneries', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.deaneries.update', 'Update Deaneries', 'Update deaneries', 'administration.deaneries', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.deaneries.delete', 'Delete Deaneries', 'Delete deaneries', 'administration.deaneries', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Parishes
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.parishes.view', 'View Parishes', 'View parishes', 'administration.parishes', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.parishes.create', 'Create Parishes', 'Create parishes', 'administration.parishes', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.parishes.update', 'Update Parishes', 'Update parishes', 'administration.parishes', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.parishes.delete', 'Delete Parishes', 'Delete parishes', 'administration.parishes', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Departments
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.departments.view', 'View Departments', 'View departments', 'administration.departments', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.departments.create', 'Create Departments', 'Create departments', 'administration.departments', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.departments.update', 'Update Departments', 'Update departments', 'administration.departments', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.departments.delete', 'Delete Departments', 'Delete departments', 'administration.departments', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Users
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.users.view', 'View Users', 'View users', 'administration.users', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.users.create', 'Create Users', 'Create users', 'administration.users', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.users.update', 'Update Users', 'Update users', 'administration.users', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.users.delete', 'Delete Users', 'Delete users', 'administration.users', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.users.export', 'Export Users', 'Export users', 'administration.users', 'export')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.users.import', 'Import Users', 'Import users', 'administration.users', 'import')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Email Templates
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.emailTemplates.view', 'View Email Templates', 'View email templates', 'administration.emailTemplates', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.emailTemplates.create', 'Create Email Templates', 'Create email templates', 'administration.emailTemplates', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.emailTemplates.update', 'Update Email Templates', 'Update email templates', 'administration.emailTemplates', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.emailTemplates.delete', 'Delete Email Templates', 'Delete email templates', 'administration.emailTemplates', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.emailTemplates.send', 'Send Email Templates', 'Send email templates', 'administration.emailTemplates', 'send')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.emailTemplates.sendBulk', 'Send Bulk Email Templates', 'Send bulk email templates', 'administration.emailTemplates', 'sendBulk')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Notifications
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.notifications.view', 'View Notifications', 'View notifications', 'administration.notifications', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.notifications.create', 'Create Notifications', 'Create notifications', 'administration.notifications', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.notifications.send', 'Send Notifications', 'Send notifications', 'administration.notifications', 'send')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('administration.notifications.delete', 'Delete Notifications', 'Delete notifications', 'administration.notifications', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- EVENTS MODULE PERMISSIONS
-- ============================================

-- Events (general)
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.view', 'View Events', 'View events', 'events', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.create', 'Create Events', 'Create events', 'events', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.update', 'Update Events', 'Update events', 'events', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.delete', 'Delete Events', 'Delete events', 'events', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.cancel', 'Cancel Events', 'Cancel events', 'events', 'cancel')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.confirm', 'Confirm Events', 'Confirm events', 'events', 'confirm')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Baptisms
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.baptisms.view', 'View Baptisms', 'View baptisms', 'events.baptisms', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.baptisms.create', 'Create Baptisms', 'Create baptisms', 'events.baptisms', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.baptisms.update', 'Update Baptisms', 'Update baptisms', 'events.baptisms', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.baptisms.delete', 'Delete Baptisms', 'Delete baptisms', 'events.baptisms', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Weddings
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.weddings.view', 'View Weddings', 'View weddings', 'events.weddings', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.weddings.create', 'Create Weddings', 'Create weddings', 'events.weddings', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.weddings.update', 'Update Weddings', 'Update weddings', 'events.weddings', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.weddings.delete', 'Delete Weddings', 'Delete weddings', 'events.weddings', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Funerals
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.funerals.view', 'View Funerals', 'View funerals', 'events.funerals', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.funerals.create', 'Create Funerals', 'Create funerals', 'events.funerals', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.funerals.update', 'Update Funerals', 'Update funerals', 'events.funerals', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.funerals.delete', 'Delete Funerals', 'Delete funerals', 'events.funerals', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Documents
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.documents.view', 'View Event Documents', 'View event documents', 'events.documents', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.documents.create', 'Create Event Documents', 'Create event documents', 'events.documents', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.documents.delete', 'Delete Event Documents', 'Delete event documents', 'events.documents', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Participants
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.participants.view', 'View Event Participants', 'View event participants', 'events.participants', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.participants.create', 'Create Event Participants', 'Create event participants', 'events.participants', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.participants.update', 'Update Event Participants', 'Update event participants', 'events.participants', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.participants.delete', 'Delete Event Participants', 'Delete event participants', 'events.participants', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Email Fetcher
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.emailFetcher.view', 'View Email Fetcher', 'View email fetcher', 'events.emailFetcher', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('events.emailFetcher.trigger', 'Trigger Email Fetcher', 'Trigger email fetcher', 'events.emailFetcher', 'trigger')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- PARISHIONERS MODULE PERMISSIONS
-- ============================================

-- Parishioners (general)
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.view', 'View Parishioners', 'View parishioners', 'parishioners', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.create', 'Create Parishioners', 'Create parishioners', 'parishioners', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.update', 'Update Parishioners', 'Update parishioners', 'parishioners', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.delete', 'Delete Parishioners', 'Delete parishioners', 'parishioners', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.search', 'Search Parishioners', 'Search parishioners', 'parishioners', 'search')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Receipts
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.receipts.view', 'View Receipts', 'View receipts', 'parishioners.receipts', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.receipts.create', 'Create Receipts', 'Create receipts', 'parishioners.receipts', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.receipts.update', 'Update Receipts', 'Update receipts', 'parishioners.receipts', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.receipts.delete', 'Delete Receipts', 'Delete receipts', 'parishioners.receipts', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.receipts.print', 'Print Receipts', 'Print receipts', 'parishioners.receipts', 'print')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Contracts
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.contracts.view', 'View Parishioner Contracts', 'View parishioner contracts', 'parishioners.contracts', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.contracts.create', 'Create Parishioner Contracts', 'Create parishioner contracts', 'parishioners.contracts', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.contracts.update', 'Update Parishioner Contracts', 'Update parishioner contracts', 'parishioners.contracts', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.contracts.delete', 'Delete Parishioner Contracts', 'Delete parishioner contracts', 'parishioners.contracts', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.contracts.renew', 'Renew Parishioner Contracts', 'Renew parishioner contracts', 'parishioners.contracts', 'renew')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.contracts.terminate', 'Terminate Parishioner Contracts', 'Terminate parishioner contracts', 'parishioners.contracts', 'terminate')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Types
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.types.view', 'View Parishioner Types', 'View parishioner types', 'parishioners.types', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.types.create', 'Create Parishioner Types', 'Create parishioner types', 'parishioners.types', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.types.update', 'Update Parishioner Types', 'Update parishioner types', 'parishioners.types', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.types.delete', 'Delete Parishioner Types', 'Delete parishioner types', 'parishioners.types', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Birthdays
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.birthdays.view', 'View Birthdays', 'View birthdays', 'parishioners.birthdays', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Name Days
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('parishioners.nameDays.view', 'View Name Days', 'View name days', 'parishioners.nameDays', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- CATECHESIS MODULE PERMISSIONS
-- ============================================

-- Classes
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.classes.view', 'View Classes', 'View classes', 'catechesis.classes', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.classes.create', 'Create Classes', 'Create classes', 'catechesis.classes', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.classes.update', 'Update Classes', 'Update classes', 'catechesis.classes', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.classes.delete', 'Delete Classes', 'Delete classes', 'catechesis.classes', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Lessons
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.lessons.view', 'View Lessons', 'View lessons', 'catechesis.lessons', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.lessons.create', 'Create Lessons', 'Create lessons', 'catechesis.lessons', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.lessons.update', 'Update Lessons', 'Update lessons', 'catechesis.lessons', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.lessons.delete', 'Delete Lessons', 'Delete lessons', 'catechesis.lessons', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Students
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.students.view', 'View Students', 'View students', 'catechesis.students', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.students.create', 'Create Students', 'Create students', 'catechesis.students', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.students.update', 'Update Students', 'Update students', 'catechesis.students', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.students.delete', 'Delete Students', 'Delete students', 'catechesis.students', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Enrollments
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.enrollments.view', 'View Enrollments', 'View enrollments', 'catechesis.enrollments', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.enrollments.create', 'Create Enrollments', 'Create enrollments', 'catechesis.enrollments', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.enrollments.update', 'Update Enrollments', 'Update enrollments', 'catechesis.enrollments', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.enrollments.delete', 'Delete Enrollments', 'Delete enrollments', 'catechesis.enrollments', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Progress
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.progress.view', 'View Progress', 'View progress', 'catechesis.progress', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('catechesis.progress.track', 'Track Progress', 'Track progress', 'catechesis.progress', 'track')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- PILGRIMAGES MODULE PERMISSIONS
-- ============================================

-- Pilgrimages (general)
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.view', 'View Pilgrimages', 'View pilgrimages', 'pilgrimages', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.create', 'Create Pilgrimages', 'Create pilgrimages', 'pilgrimages', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.update', 'Update Pilgrimages', 'Update pilgrimages', 'pilgrimages', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.delete', 'Delete Pilgrimages', 'Delete pilgrimages', 'pilgrimages', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.approve', 'Approve Pilgrimages', 'Approve pilgrimages', 'pilgrimages', 'approve')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.publish', 'Publish Pilgrimages', 'Publish pilgrimages', 'pilgrimages', 'publish')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.close', 'Close Pilgrimages', 'Close pilgrimages', 'pilgrimages', 'close')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.cancel', 'Cancel Pilgrimages', 'Cancel pilgrimages', 'pilgrimages', 'cancel')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Participants
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.participants.view', 'View Pilgrimage Participants', 'View pilgrimage participants', 'pilgrimages.participants', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.participants.create', 'Create Pilgrimage Participants', 'Create pilgrimage participants', 'pilgrimages.participants', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.participants.update', 'Update Pilgrimage Participants', 'Update pilgrimage participants', 'pilgrimages.participants', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.participants.delete', 'Delete Pilgrimage Participants', 'Delete pilgrimage participants', 'pilgrimages.participants', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.participants.confirm', 'Confirm Pilgrimage Participants', 'Confirm pilgrimage participants', 'pilgrimages.participants', 'confirm')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.participants.cancel', 'Cancel Pilgrimage Participants', 'Cancel pilgrimage participants', 'pilgrimages.participants', 'cancel')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Payments
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.payments.view', 'View Pilgrimage Payments', 'View pilgrimage payments', 'pilgrimages.payments', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.payments.create', 'Create Pilgrimage Payments', 'Create pilgrimage payments', 'pilgrimages.payments', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.payments.update', 'Update Pilgrimage Payments', 'Update pilgrimage payments', 'pilgrimages.payments', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.payments.delete', 'Delete Pilgrimage Payments', 'Delete pilgrimage payments', 'pilgrimages.payments', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Documents
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.documents.view', 'View Pilgrimage Documents', 'View pilgrimage documents', 'pilgrimages.documents', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.documents.create', 'Create Pilgrimage Documents', 'Create pilgrimage documents', 'pilgrimages.documents', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.documents.delete', 'Delete Pilgrimage Documents', 'Delete pilgrimage documents', 'pilgrimages.documents', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Meals
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.meals.view', 'View Meals', 'View meals', 'pilgrimages.meals', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.meals.create', 'Create Meals', 'Create meals', 'pilgrimages.meals', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.meals.update', 'Update Meals', 'Update meals', 'pilgrimages.meals', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.meals.delete', 'Delete Meals', 'Delete meals', 'pilgrimages.meals', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Accommodation
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.accommodation.view', 'View Accommodation', 'View accommodation', 'pilgrimages.accommodation', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.accommodation.create', 'Create Accommodation', 'Create accommodation', 'pilgrimages.accommodation', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.accommodation.update', 'Update Accommodation', 'Update accommodation', 'pilgrimages.accommodation', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.accommodation.delete', 'Delete Accommodation', 'Delete accommodation', 'pilgrimages.accommodation', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Transport
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.transport.view', 'View Transport', 'View transport', 'pilgrimages.transport', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.transport.create', 'Create Transport', 'Create transport', 'pilgrimages.transport', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.transport.update', 'Update Transport', 'Update transport', 'pilgrimages.transport', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.transport.delete', 'Delete Transport', 'Delete transport', 'pilgrimages.transport', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Schedule
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.schedule.view', 'View Schedule', 'View schedule', 'pilgrimages.schedule', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.schedule.create', 'Create Schedule', 'Create schedule', 'pilgrimages.schedule', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.schedule.update', 'Update Schedule', 'Update schedule', 'pilgrimages.schedule', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.schedule.delete', 'Delete Schedule', 'Delete schedule', 'pilgrimages.schedule', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Statistics
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pilgrimages.statistics.view', 'View Pilgrimage Statistics', 'View pilgrimage statistics', 'pilgrimages.statistics', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- ONLINE FORMS MODULE PERMISSIONS
-- ============================================

-- Forms
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.view', 'View Online Forms', 'View online forms', 'onlineForms', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.create', 'Create Online Forms', 'Create online forms', 'onlineForms', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.update', 'Update Online Forms', 'Update online forms', 'onlineForms', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.delete', 'Delete Online Forms', 'Delete online forms', 'onlineForms', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Submissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.submissions.view', 'View Form Submissions', 'View form submissions', 'onlineForms.submissions', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.submissions.process', 'Process Form Submissions', 'Process form submissions', 'onlineForms.submissions', 'process')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.submissions.delete', 'Delete Form Submissions', 'Delete form submissions', 'onlineForms.submissions', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Mapping Datasets
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.mappingDatasets.view', 'View Mapping Datasets', 'View mapping datasets', 'onlineForms.mappingDatasets', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.mappingDatasets.create', 'Create Mapping Datasets', 'Create mapping datasets', 'onlineForms.mappingDatasets', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.mappingDatasets.update', 'Update Mapping Datasets', 'Update mapping datasets', 'onlineForms.mappingDatasets', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('onlineForms.mappingDatasets.delete', 'Delete Mapping Datasets', 'Delete mapping datasets', 'onlineForms.mappingDatasets', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- PANGARE MODULE PERMISSIONS
-- ============================================

-- Pangare (general)
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.view', 'View Pangare', 'View pangare', 'pangare', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Inventar
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.inventar.view', 'View Inventar', 'View inventar', 'pangare.inventar', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.inventar.create', 'Create Inventar', 'Create inventar', 'pangare.inventar', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.inventar.update', 'Update Inventar', 'Update inventar', 'pangare.inventar', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.inventar.delete', 'Delete Inventar', 'Delete inventar', 'pangare.inventar', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Utilizatori
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.utilizatori.view', 'View Utilizatori', 'View utilizatori', 'pangare.utilizatori', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.utilizatori.create', 'Create Utilizatori', 'Create utilizatori', 'pangare.utilizatori', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.utilizatori.update', 'Update Utilizatori', 'Update utilizatori', 'pangare.utilizatori', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('pangare.utilizatori.delete', 'Delete Utilizatori', 'Delete utilizatori', 'pangare.utilizatori', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- CHAT MODULE PERMISSIONS
-- ============================================

-- Chat (general)
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('chat.view', 'View Chat', 'View chat', 'chat', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('chat.send', 'Send Messages', 'Send chat messages', 'chat', 'send')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('chat.manage', 'Manage Chat', 'Manage chat', 'chat', 'manage')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Files
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('chat.files.upload', 'Upload Chat Files', 'Upload files to chat', 'chat.files', 'upload')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('chat.files.download', 'Download Chat Files', 'Download files from chat', 'chat.files', 'download')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- ANALYTICS MODULE PERMISSIONS
-- ============================================

-- Analytics (general)
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('analytics.view', 'View Analytics', 'View analytics', 'analytics', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Reports
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('analytics.reports.view', 'View Analytics Reports', 'View analytics reports', 'analytics.reports', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('analytics.reports.export', 'Export Analytics Reports', 'Export analytics reports', 'analytics.reports', 'export')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- DATA STATISTICS MODULE PERMISSIONS
-- ============================================

-- Data Statistics (general)
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('dataStatistics.view', 'View Data Statistics', 'View data statistics', 'dataStatistics', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('dataStatistics.export', 'Export Data Statistics', 'Export data statistics', 'dataStatistics', 'export')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Fake Data (dev/admin only)
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('dataStatistics.generateFakeData', 'Generate Fake Data', 'Generate fake data for testing', 'dataStatistics', 'generateFakeData')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('dataStatistics.deleteFakeData', 'Delete Fake Data', 'Delete fake data', 'dataStatistics', 'deleteFakeData')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- SUPERADMIN MODULE PERMISSIONS
-- ============================================

-- Roles
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.roles.view', 'View Roles', 'View roles', 'superadmin.roles', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.roles.create', 'Create Roles', 'Create roles', 'superadmin.roles', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.roles.update', 'Update Roles', 'Update roles', 'superadmin.roles', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.roles.delete', 'Delete Roles', 'Delete roles', 'superadmin.roles', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.permissions.view', 'View Permissions', 'View permissions', 'superadmin.permissions', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.permissions.create', 'Create Permissions', 'Create permissions', 'superadmin.permissions', 'create')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.permissions.update', 'Update Permissions', 'Update permissions', 'superadmin.permissions', 'update')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.permissions.delete', 'Delete Permissions', 'Delete permissions', 'superadmin.permissions', 'delete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.permissions.bulkDelete', 'Bulk Delete Permissions', 'Bulk delete permissions', 'superadmin.permissions', 'bulkDelete')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- User Roles
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.userRoles.view', 'View User Roles', 'View user roles', 'superadmin.userRoles', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.userRoles.assign', 'Assign User Roles', 'Assign roles to users', 'superadmin.userRoles', 'assign')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.userRoles.remove', 'Remove User Roles', 'Remove roles from users', 'superadmin.userRoles', 'remove')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- Role Permissions
INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.rolePermissions.view', 'View Role Permissions', 'View role permissions', 'superadmin.rolePermissions', 'view')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.rolePermissions.assign', 'Assign Role Permissions', 'Assign permissions to roles', 'superadmin.rolePermissions', 'assign')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

INSERT INTO permissions (name, display_name, description, resource, action) VALUES
('superadmin.rolePermissions.remove', 'Remove Role Permissions', 'Remove permissions from roles', 'superadmin.rolePermissions', 'remove')
ON CONFLICT (name) DO NOTHING;
--> statement-breakpoint

-- ============================================
-- ASSIGN PERMISSIONS TO SUPERADMIN ROLE
-- ============================================

-- Assign all new permissions to superadmin role (superadmin has all permissions by default in code, but we add them explicitly for consistency)
-- Note: In practice, superadmin role bypasses permission checks, but we add these for consistency
DO $$
DECLARE
    superadmin_role_id uuid;
    permission_record record;
BEGIN
    -- Get superadmin role ID
    SELECT id INTO superadmin_role_id FROM roles WHERE name = 'superadmin' LIMIT 1;
    
    IF superadmin_role_id IS NOT NULL THEN
        -- Assign all new module permissions to superadmin (excluding hr.* and cemeteries.* which were already assigned)
        FOR permission_record IN 
            SELECT id FROM permissions 
            WHERE name LIKE 'registratura.%' 
               OR name LIKE 'accounting.%'
               OR name LIKE 'administration.%'
               OR name LIKE 'events.%'
               OR name LIKE 'parishioners.%'
               OR name LIKE 'catechesis.%'
               OR name LIKE 'pilgrimages.%'
               OR name LIKE 'onlineForms.%'
               OR name LIKE 'pangare.%'
               OR name LIKE 'chat.%'
               OR name LIKE 'analytics.%'
               OR name LIKE 'dataStatistics.%'
               OR name LIKE 'superadmin.%'
        LOOP
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES (superadmin_role_id, permission_record.id)
            ON CONFLICT DO NOTHING;
        END LOOP;
    END IF;
END $$;
--> statement-breakpoint

