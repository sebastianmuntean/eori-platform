import { pgTable, uuid, varchar, text, timestamp, date } from "drizzle-orm/pg-core";

// Registru incasari si plati (income and payments register)
export const rip = pgTable("rip", {
  id: uuid("id").primaryKey().defaultRandom(),
  codDomeniu: varchar("cod_domeniu", { length: 255 }),
  data: date("data").notNull(),
  tipDoc: varchar("tip_doc", { length: 255 }),
  serieDoc: varchar("serie_doc", { length: 255 }),
  nrDoc: varchar("nr_doc", { length: 50 }),
  serieBonPlata: varchar("serie_bon_plata", { length: 255 }),
  nrBonPlata: varchar("nr_bon_plata", { length: 50 }),
  explicatii: text("explicatii"),
  valIncasare: varchar("val_incasare", { length: 255 }),
  valPlata: varchar("val_plata", { length: 255 }),
  cont: varchar("cont", { length: 255 }),
  tipPartener: varchar("tip_partener", { length: 255 }),
  codPartener: varchar("cod_partener", { length: 255 }),
  idDoc: uuid("id_doc"),
  dataValabilitatii: date("data_valabilitatii"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});




