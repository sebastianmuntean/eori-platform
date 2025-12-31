/**
 * Drizzle ORM Relations
 * 
 * Defines relationships between tables for the query builder
 */

import { relations } from "drizzle-orm";

// Core
import { dioceses } from "./core/dioceses";
import { deaneries } from "./core/deaneries";
import { parishes } from "./core/parishes";
import { partners } from "./core/partners";

// Auth
import { users } from "./auth/users";
import { roles } from "./auth/roles";
import { permissions } from "./auth/permissions";
import { rolePermissions } from "./auth/role-permissions";
import { userRoles } from "./auth/user-roles";
import { userParishes } from "./auth/user-parishes";
import { userPermissionOverrides } from "./auth/user-permission-overrides";
import { sessions } from "./auth/sessions";

// Documents
import { documents } from "./documents/documents";
import { documentNumberCounters } from "./documents/document-number-counters";
import { attachments } from "./documents/attachments";

// Cemetery
import { cemeteries } from "./cemetery/cemeteries";
import { cemeteryParcels } from "./cemetery/parcels";
import { cemeteryRows } from "./cemetery/rows";
import { cemeteryGraves } from "./cemetery/graves";
import { concessions } from "./cemetery/concessions";
import { concessionPayments } from "./cemetery/concession-payments";
import { burials } from "./cemetery/burials";

// Accounting
import { accounts } from "./accounting/accounts";
import { transactions } from "./accounting/transactions";
import { invoices } from "./accounting/invoices";
import { invoiceItems } from "./accounting/invoice-items";
import { invoicePayments } from "./accounting/invoice-payments";
import { receiptSeries } from "./accounting/receipt-series";

// Inventory
import { warehouses } from "./inventory/warehouses";
import { products } from "./inventory/products";
import { stockLots } from "./inventory/stock-lots";
import { stockMovements } from "./inventory/stock-movements";
import { sales } from "./inventory/sales";
import { saleItems } from "./inventory/sale-items";

// Library
import { libraryAuthors } from "./library/authors";
import { libraryPublishers } from "./library/publishers";
import { libraryDomains } from "./library/domains";
import { libraryBooks } from "./library/books";
import { libraryLoans } from "./library/loans";

// Fleet
import { vehicles } from "./fleet/vehicles";
import { vehicleInsurances } from "./fleet/insurances";
import { vehicleInspections } from "./fleet/inspections";
import { vehicleRepairs } from "./fleet/repairs";

// Assets
import { fixedAssets } from "./assets/fixed-assets";

// HR
import { employees } from "./hr/employees";
import { leaves } from "./hr/leaves";
import { timesheets } from "./hr/timesheets";

// Settings
import { parishSettings } from "./settings/parish-settings";

// Audit
import { activityLog } from "./audit/activity-log";

// Notifications
import { notifications } from "./notifications/notifications";

// ==========================================
// Core Relations
// ==========================================

export const diocesesRelations = relations(dioceses, ({ many }) => ({
  deaneries: many(deaneries),
  parishes: many(parishes),
}));

export const deaneriesRelations = relations(deaneries, ({ one, many }) => ({
  diocese: one(dioceses, {
    fields: [deaneries.dioceseId],
    references: [dioceses.id],
  }),
  parishes: many(parishes),
}));

export const parishesRelations = relations(parishes, ({ one, many }) => ({
  diocese: one(dioceses, {
    fields: [parishes.dioceseId],
    references: [dioceses.id],
  }),
  deanery: one(deaneries, {
    fields: [parishes.deaneryId],
    references: [deaneries.id],
  }),
  partners: many(partners),
  documents: many(documents),
  cemeteries: many(cemeteries),
  warehouses: many(warehouses),
  settings: one(parishSettings, {
    fields: [parishes.id],
    references: [parishSettings.parishId],
  }),
}));

export const partnersRelations = relations(partners, ({ one, many }) => ({
  parish: one(parishes, {
    fields: [partners.parishId],
    references: [parishes.id],
  }),
  concessions: many(concessions),
  invoices: many(invoices),
}));

// ==========================================
// Auth Relations
// ==========================================

export const usersRelations = relations(users, ({ many }) => ({
  userRoles: many(userRoles),
  userParishes: many(userParishes),
  userPermissionOverrides: many(userPermissionOverrides),
  sessions: many(sessions),
}));

export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
  rolePermissions: many(rolePermissions),
}));

export const permissionsRelations = relations(permissions, ({ many }) => ({
  rolePermissions: many(rolePermissions),
  userPermissionOverrides: many(userPermissionOverrides),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, {
    fields: [rolePermissions.roleId],
    references: [roles.id],
  }),
  permission: one(permissions, {
    fields: [rolePermissions.permissionId],
    references: [permissions.id],
  }),
}));

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}));

export const userParishesRelations = relations(userParishes, ({ one }) => ({
  user: one(users, {
    fields: [userParishes.userId],
    references: [users.id],
  }),
  parish: one(parishes, {
    fields: [userParishes.parishId],
    references: [parishes.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ==========================================
// Documents Relations
// ==========================================

export const documentsRelations = relations(documents, ({ one, many }) => ({
  parish: one(parishes, {
    fields: [documents.parishId],
    references: [parishes.id],
  }),
  senderPartner: one(partners, {
    fields: [documents.senderPartnerId],
    references: [partners.id],
  }),
  recipientPartner: one(partners, {
    fields: [documents.recipientPartnerId],
    references: [partners.id],
  }),
  createdByUser: one(users, {
    fields: [documents.createdBy],
    references: [users.id],
  }),
  parentDocument: one(documents, {
    fields: [documents.parentDocumentId],
    references: [documents.id],
  }),
  attachments: many(attachments),
}));

// ==========================================
// Cemetery Relations
// ==========================================

export const cemeteriesRelations = relations(cemeteries, ({ one, many }) => ({
  parish: one(parishes, {
    fields: [cemeteries.parishId],
    references: [parishes.id],
  }),
  parcels: many(cemeteryParcels),
  concessions: many(concessions),
}));

export const cemeteryParcelsRelations = relations(cemeteryParcels, ({ one, many }) => ({
  cemetery: one(cemeteries, {
    fields: [cemeteryParcels.cemeteryId],
    references: [cemeteries.id],
  }),
  rows: many(cemeteryRows),
}));

export const cemeteryRowsRelations = relations(cemeteryRows, ({ one, many }) => ({
  parcel: one(cemeteryParcels, {
    fields: [cemeteryRows.parcelId],
    references: [cemeteryParcels.id],
  }),
  graves: many(cemeteryGraves),
}));

export const cemeteryGravesRelations = relations(cemeteryGraves, ({ one, many }) => ({
  row: one(cemeteryRows, {
    fields: [cemeteryGraves.rowId],
    references: [cemeteryRows.id],
  }),
  concessions: many(concessions),
  burials: many(burials),
}));

export const concessionsRelations = relations(concessions, ({ one, many }) => ({
  grave: one(cemeteryGraves, {
    fields: [concessions.graveId],
    references: [cemeteryGraves.id],
  }),
  cemetery: one(cemeteries, {
    fields: [concessions.cemeteryId],
    references: [cemeteries.id],
  }),
  holder: one(partners, {
    fields: [concessions.holderPartnerId],
    references: [partners.id],
  }),
  payments: many(concessionPayments),
}));

export const concessionPaymentsRelations = relations(concessionPayments, ({ one }) => ({
  concession: one(concessions, {
    fields: [concessionPayments.concessionId],
    references: [concessions.id],
  }),
}));

export const burialsRelations = relations(burials, ({ one }) => ({
  grave: one(cemeteryGraves, {
    fields: [burials.graveId],
    references: [cemeteryGraves.id],
  }),
  concession: one(concessions, {
    fields: [burials.concessionId],
    references: [concessions.id],
  }),
}));

// ==========================================
// Accounting Relations
// ==========================================

export const transactionsRelations = relations(transactions, ({ one }) => ({
  parish: one(parishes, {
    fields: [transactions.parishId],
    references: [parishes.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
  partner: one(partners, {
    fields: [transactions.partnerId],
    references: [partners.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  parish: one(parishes, {
    fields: [invoices.parishId],
    references: [parishes.id],
  }),
  partner: one(partners, {
    fields: [invoices.partnerId],
    references: [partners.id],
  }),
  items: many(invoiceItems),
  payments: many(invoicePayments),
}));

export const invoiceItemsRelations = relations(invoiceItems, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoiceItems.invoiceId],
    references: [invoices.id],
  }),
}));

export const invoicePaymentsRelations = relations(invoicePayments, ({ one }) => ({
  invoice: one(invoices, {
    fields: [invoicePayments.invoiceId],
    references: [invoices.id],
  }),
  transaction: one(transactions, {
    fields: [invoicePayments.transactionId],
    references: [transactions.id],
  }),
}));

// ==========================================
// Inventory Relations
// ==========================================

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  parish: one(parishes, {
    fields: [warehouses.parishId],
    references: [parishes.id],
  }),
  stockLots: many(stockLots),
  movements: many(stockMovements),
  sales: many(sales),
}));

export const productsRelations = relations(products, ({ many }) => ({
  stockLots: many(stockLots),
  movements: many(stockMovements),
  saleItems: many(saleItems),
}));

export const stockLotsRelations = relations(stockLots, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [stockLots.warehouseId],
    references: [warehouses.id],
  }),
  product: one(products, {
    fields: [stockLots.productId],
    references: [products.id],
  }),
}));

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [stockMovements.warehouseId],
    references: [warehouses.id],
  }),
  product: one(products, {
    fields: [stockMovements.productId],
    references: [products.id],
  }),
  partner: one(partners, {
    fields: [stockMovements.partnerId],
    references: [partners.id],
  }),
  lot: one(stockLots, {
    fields: [stockMovements.lotId],
    references: [stockLots.id],
  }),
}));

export const salesRelations = relations(sales, ({ one, many }) => ({
  warehouse: one(warehouses, {
    fields: [sales.warehouseId],
    references: [warehouses.id],
  }),
  partner: one(partners, {
    fields: [sales.partnerId],
    references: [partners.id],
  }),
  items: many(saleItems),
}));

export const saleItemsRelations = relations(saleItems, ({ one }) => ({
  sale: one(sales, {
    fields: [saleItems.saleId],
    references: [sales.id],
  }),
  product: one(products, {
    fields: [saleItems.productId],
    references: [products.id],
  }),
}));

// ==========================================
// Library Relations
// ==========================================

export const libraryBooksRelations = relations(libraryBooks, ({ one, many }) => ({
  author: one(libraryAuthors, {
    fields: [libraryBooks.authorId],
    references: [libraryAuthors.id],
  }),
  publisher: one(libraryPublishers, {
    fields: [libraryBooks.publisherId],
    references: [libraryPublishers.id],
  }),
  domain: one(libraryDomains, {
    fields: [libraryBooks.domainId],
    references: [libraryDomains.id],
  }),
  loans: many(libraryLoans),
}));

export const libraryLoansRelations = relations(libraryLoans, ({ one }) => ({
  book: one(libraryBooks, {
    fields: [libraryLoans.bookId],
    references: [libraryBooks.id],
  }),
  borrower: one(partners, {
    fields: [libraryLoans.borrowerPartnerId],
    references: [partners.id],
  }),
}));

// ==========================================
// Fleet Relations
// ==========================================

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  parish: one(parishes, {
    fields: [vehicles.parishId],
    references: [parishes.id],
  }),
  insurances: many(vehicleInsurances),
  inspections: many(vehicleInspections),
  repairs: many(vehicleRepairs),
}));

export const vehicleInsurancesRelations = relations(vehicleInsurances, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleInsurances.vehicleId],
    references: [vehicles.id],
  }),
}));

export const vehicleInspectionsRelations = relations(vehicleInspections, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleInspections.vehicleId],
    references: [vehicles.id],
  }),
}));

export const vehicleRepairsRelations = relations(vehicleRepairs, ({ one }) => ({
  vehicle: one(vehicles, {
    fields: [vehicleRepairs.vehicleId],
    references: [vehicles.id],
  }),
}));

// ==========================================
// HR Relations
// ==========================================

export const employeesRelations = relations(employees, ({ one, many }) => ({
  parish: one(parishes, {
    fields: [employees.parishId],
    references: [parishes.id],
  }),
  partner: one(partners, {
    fields: [employees.partnerId],
    references: [partners.id],
  }),
  leaves: many(leaves),
  timesheets: many(timesheets),
}));

export const leavesRelations = relations(leaves, ({ one }) => ({
  employee: one(employees, {
    fields: [leaves.employeeId],
    references: [employees.id],
  }),
  approver: one(users, {
    fields: [leaves.approvedBy],
    references: [users.id],
  }),
}));

export const timesheetsRelations = relations(timesheets, ({ one }) => ({
  employee: one(employees, {
    fields: [timesheets.employeeId],
    references: [employees.id],
  }),
}));

// ==========================================
// Notifications Relations
// ==========================================

export const notificationsRelations = relations(notifications, ({ one }) => ({
  parish: one(parishes, {
    fields: [notifications.parishId],
    references: [parishes.id],
  }),
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));
