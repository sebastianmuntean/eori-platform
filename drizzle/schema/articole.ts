import { pgTable, uuid, varchar, numeric, timestamp } from "drizzle-orm/pg-core";

// Articole (articles/items in stock)
export const articole = pgTable("articole", {
  id: uuid("id").primaryKey().defaultRandom(),
  codDomeniu: varchar("cod_domeniu", { length: 255 }),
  codProdus: varchar("cod_produs", { length: 255 }),
  cantitate: numeric("cantitate", { precision: 10, scale: 2 }),
  pretIntrare: numeric("pret_intrare", { precision: 10, scale: 2 }),
  valoareIntrare: numeric("valoare_intrare", { precision: 10, scale: 2 }),
  pretIesire: numeric("pret_iesire", { precision: 10, scale: 2 }),
  valoareIesire: numeric("valoare_iesire", { precision: 10, scale: 2 }),
  tvaIntrare: numeric("tva_intrare", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});




