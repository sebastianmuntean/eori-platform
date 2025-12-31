import { pgTable, uuid, varchar, text, boolean, timestamp, integer, decimal, date, index } from "drizzle-orm/pg-core";
import { dioceses } from "./dioceses";
import { deaneries } from "./deaneries";

/**
 * Parishes table (Parohii)
 * The main tenant unit - all operational data belongs to a parish
 */
export const parishes = pgTable("parishes", {
  id: uuid("id").defaultRandom().primaryKey(),
  deaneryId: uuid("deanery_id").references(() => deaneries.id, { onDelete: "set null" }),
  dioceseId: uuid("diocese_id").notNull().references(() => dioceses.id, { onDelete: "restrict" }),
  code: varchar("code", { length: 20 }).notNull().unique(), // PAR-001
  name: varchar("name", { length: 255 }).notNull(),
  patronSaintDay: date("patron_saint_day"), // Hram
  address: text("address"),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  postalCode: varchar("postal_code", { length: 20 }),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  website: varchar("website", { length: 255 }),
  priestName: varchar("priest_name", { length: 255 }), // Paroh
  vicarName: varchar("vicar_name", { length: 255 }), // Vicar
  parishionerCount: integer("parishioner_count"), // Număr enoriași
  foundedYear: integer("founded_year"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  idxDeanery: index("idx_parishes_deanery").on(table.deaneryId),
  idxDiocese: index("idx_parishes_diocese").on(table.dioceseId),
  idxActive: index("idx_parishes_active").on(table.isActive),
  idxCity: index("idx_parishes_city").on(table.city),
  idxCounty: index("idx_parishes_county").on(table.county),
}));

export type Parish = typeof parishes.$inferSelect;
export type NewParish = typeof parishes.$inferInsert;
