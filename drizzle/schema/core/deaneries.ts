import { pgTable, uuid, varchar, text, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { dioceses } from "./dioceses";

/**
 * Deaneries table (Protopopiate)
 * Mid-level organizational unit, belonging to a diocese
 */
export const deaneries = pgTable("deaneries", {
  id: uuid("id").defaultRandom().primaryKey(),
  dioceseId: uuid("diocese_id").notNull().references(() => dioceses.id, { onDelete: "restrict" }),
  code: varchar("code", { length: 20 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  county: varchar("county", { length: 100 }),
  deanName: varchar("dean_name", { length: 255 }), // Protopop
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueCode: unique("deaneries_diocese_code_unique").on(table.dioceseId, table.code),
  idxDiocese: index("idx_deaneries_diocese").on(table.dioceseId),
  idxActive: index("idx_deaneries_active").on(table.isActive),
}));

export type Deanery = typeof deaneries.$inferSelect;
export type NewDeanery = typeof deaneries.$inferInsert;
