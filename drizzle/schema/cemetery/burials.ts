import { pgTable, uuid, varchar, text, timestamp, date, index } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { users } from "../auth/users";
import { cemeteryGraves } from "./graves";
import { concessions } from "./concessions";

/**
 * Burials table (Înmormântări)
 * Records of deceased persons buried in graves
 */
export const burials = pgTable("burials", {
  id: uuid("id").defaultRandom().primaryKey(),
  graveId: uuid("grave_id").notNull().references(() => cemeteryGraves.id, { onDelete: "restrict" }),
  concessionId: uuid("concession_id").references(() => concessions.id, { onDelete: "set null" }),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  // Deceased
  deceasedName: varchar("deceased_name", { length: 255 }).notNull(),
  deceasedBirthDate: date("deceased_birth_date"),
  deceasedDeathDate: date("deceased_death_date"),
  burialDate: date("burial_date").notNull(),
  
  // Death certificate
  deathCertificateNumber: varchar("death_certificate_number", { length: 50 }),
  deathCertificateDate: date("death_certificate_date"),
  deathCertificateIssuer: varchar("death_certificate_issuer", { length: 255 }),
  
  notes: text("notes"),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
}, (table) => ({
  idxGrave: index("idx_burials_grave").on(table.graveId),
  idxParish: index("idx_burials_parish").on(table.parishId),
  idxParishDate: index("idx_burials_parish_date").on(table.parishId, table.burialDate),
  idxConcession: index("idx_burials_concession").on(table.concessionId),
}));

export type Burial = typeof burials.$inferSelect;
export type NewBurial = typeof burials.$inferInsert;
