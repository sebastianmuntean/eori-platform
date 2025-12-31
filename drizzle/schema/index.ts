/**
 * EORI Platform - Database Schema
 * 
 * This file exports all database schemas organized by module.
 * All tables follow the multi-tenant pattern with parish_id where applicable.
 */

// ==========================================
// Core organizational schemas
// ==========================================
export * from "./core";

// ==========================================
// Authentication and authorization schemas
// ==========================================
export * from "./auth";

// ==========================================
// Documents module (Registratură)
// ==========================================
export * from "./documents";

// ==========================================
// Cemetery module (Cimitir)
// ==========================================
export * from "./cemetery";

// ==========================================
// Accounting module (Contabilitate)
// ==========================================
export * from "./accounting";

// ==========================================
// Inventory module (Gestiuni)
// ==========================================
export * from "./inventory";

// ==========================================
// Library module (Bibliotecă)
// ==========================================
export * from "./library";

// ==========================================
// Fleet module (Parc Auto)
// ==========================================
export * from "./fleet";

// ==========================================
// Assets module (Mijloace Fixe)
// ==========================================
export * from "./assets";

// ==========================================
// HR module (Resurse Umane)
// ==========================================
export * from "./hr";

// ==========================================
// Settings module
// ==========================================
export * from "./settings";

// ==========================================
// Audit module (Activity Log)
// ==========================================
export * from "./audit";

// ==========================================
// Notifications module
// ==========================================
export * from "./notifications";

// ==========================================
// Relations (for query builder)
// ==========================================
export * from "./relations";
