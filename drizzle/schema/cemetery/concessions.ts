import { pgTable, uuid, varchar, text, boolean, timestamp, integer, decimal, date, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { partners } from "../core/partners";
import { users } from "../auth/users";
import { cemeteries } from "./cemeteries";
import { cemeteryGraves } from "./graves";

/**
 * Concession status enum
 */
export const concessionStatusEnum = pgEnum("concession_status", ["active", "expired", "renewed", "terminated"]);

/**
 * Concessions table (Concesiuni)
 * Burial plot concession contracts
 */
export const concessions = pgTable("concessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  graveId: uuid("grave_id").notNull().references(() => cemeteryGraves.id, { onDelete: "restrict" }),
  cemeteryId: uuid("cemetery_id").notNull().references(() => cemeteries.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Concessionaire (holder)
  holderPartnerId: uuid("holder_partner_id").notNull().references(() => partners.id, { onDelete: "restrict" }),
  
  // Contract
  contractNumber: varchar("contract_number", { length: 50 }).notNull(),
  contractDate: date("contract_date").notNull(),
  
  // Period
  startDate: date("start_date").notNull(),
  expiryDate: date("expiry_date").notNull(),
  durationYears: integer("duration_years").notNull(), // 7, 25, 50, perpetual=99
  
  // Financial
  annualFee: decimal("annual_fee", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("RON"),
  
  status: concessionStatusEnum("status").default("active"),
  
  // Calculated flags (updated by cron/trigger)
  isExpired: boolean("is_expired").default(false),
  expiresInDays: integer("expires_in_days"), // Calculated periodically
  
  notes: text("notes"),
  
  // Audit
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  updatedBy: uuid("updated_by").references(() => users.id),
}, (table) => ({
  uniqueParishContract: unique("concessions_parish_contract_unique").on(table.parishId, table.contractNumber),
  idxParishExpiry: index("idx_concessions_parish_expiry").on(table.parishId, table.expiryDate),
  idxParishStatus: index("idx_concessions_parish_status").on(table.parishId, table.status),
  idxCemetery: index("idx_concessions_cemetery").on(table.cemeteryId),
  idxGrave: index("idx_concessions_grave").on(table.graveId),
  idxExpired: index("idx_concessions_expired").on(table.parishId, table.isExpired),
  idxHolder: index("idx_concessions_holder").on(table.holderPartnerId),
}));

export type Concession = typeof concessions.$inferSelect;
export type NewConcession = typeof concessions.$inferInsert;
