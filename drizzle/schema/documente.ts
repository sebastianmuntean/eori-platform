import { pgTable, uuid, varchar, numeric, timestamp, date } from "drizzle-orm/pg-core";

// Documente (general documents)
export const documente = pgTable("documente", {
  id: uuid("id").primaryKey().defaultRandom(),
  codDomeniu: varchar("cod_domeniu", { length: 255 }),
  tipInregistrare: varchar("tip_inregistrare", { length: 255 }),
  destinatie: varchar("destinatie", { length: 255 }),
  nrNir: varchar("nr_nir", { length: 50 }),
  tipDoc: varchar("tip_doc", { length: 255 }),
  nrDoc: varchar("nr_doc", { length: 50 }),
  dataDoc: date("data_doc"),
  codPartener: varchar("cod_partener", { length: 255 }),
  valoareIntrare: numeric("valoare_intrare", { precision: 10, scale: 2 }),
  valoareIesire: numeric("valoare_iesire", { precision: 10, scale: 2 }),
  tvaIntrare: numeric("tva_intrare", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});




