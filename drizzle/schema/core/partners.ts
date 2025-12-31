import { pgTable, uuid, varchar, text, boolean, timestamp, date, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "./parishes";

/**
 * Partner types enum
 */
export const partnerTypeEnum = pgEnum("partner_type", [
  "person",      // Persoană fizică
  "company",     // Persoană juridică
  "supplier",    // Furnizor
  "donor",       // Donator
  "employee",    // Angajat
  "parishioner", // Enoriaș
  "other"
]);

/**
 * Partners table
 * Universal entity for persons/companies used across modules:
 * - Cemetery (concessionaires)
 * - Invoices (suppliers/customers)
 * - Donations
 * - Employees
 * - Parishioners
 */
export const partners = pgTable("partners", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Type and identification
  type: partnerTypeEnum("type").notNull().default("person"),
  code: varchar("code", { length: 50 }).notNull(), // AUTO-GENERATED: PRT-000001
  
  // Person data (persoană fizică)
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  cnp: varchar("cnp", { length: 13 }), // CNP - sensitive, should be encrypted
  birthDate: date("birth_date"),
  
  // Company data (persoană juridică)
  companyName: varchar("company_name", { length: 255 }),
  cui: varchar("cui", { length: 20 }), // CUI/CIF
  regCom: varchar("reg_com", { length: 50 }), // Registrul Comerțului
  
  // Contact
  address: text("address"),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  
  // Bank details
  bankName: varchar("bank_name", { length: 255 }),
  iban: varchar("iban", { length: 34 }),
  
  // Metadata
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid("updated_by"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => ({
  uniqueParishCode: unique("partners_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_partners_parish").on(table.parishId),
  idxType: index("idx_partners_type").on(table.type),
  idxParishType: index("idx_partners_parish_type").on(table.parishId, table.type),
  idxActive: index("idx_partners_active").on(table.parishId, table.isActive),
  idxLastName: index("idx_partners_last_name").on(table.lastName),
  idxCompanyName: index("idx_partners_company_name").on(table.companyName),
}));

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;

/**
 * Helper to get display name for a partner
 * Usage: getPartnerDisplayName(partner)
 */
export function getPartnerDisplayName(partner: Partner): string {
  if (partner.companyName) {
    return partner.companyName;
  }
  return `${partner.lastName || ""} ${partner.firstName || ""}`.trim();
}
