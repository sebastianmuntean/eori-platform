import { pgTable, uuid, varchar, text, numeric, timestamp, date, boolean } from "drizzle-orm/pg-core";

// Cimitire table (cemeteries)
export const cimitire = pgTable("cimitire", {
  id: uuid("id").primaryKey().defaultRandom(),
  cod: varchar("cod", { length: 50 }).notNull().unique(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  adresa: text("adresa"),
  localitate: varchar("localitate", { length: 255 }),
  judet: varchar("judet", { length: 255 }),
  suprafataTotala: numeric("suprafata_totala", { precision: 10, scale: 2 }),
  nrParcele: numeric("nr_parcele", { precision: 10, scale: 0 }),
  observatii: text("observatii"),
  activ: boolean("activ").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cimitir parcele (cemetery parcels)
export const cimitirParcele = pgTable("cimitir_parcele", {
  codp: varchar("codp", { length: 255 }).primaryKey(),
  cimitirId: uuid("cimitir_id").references(() => cimitire.id),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Add cimitir_id to other tables as well (for easy filtering)

// Cimitir randuri (cemetery rows)
export const cimitirRanduri = pgTable("cimitir_randuri", {
  id: uuid("id").primaryKey().defaultRandom(),
  cimitirId: uuid("cimitir_id").references(() => cimitire.id),
  codp: varchar("codp", { length: 255 }).references(() => cimitirParcele.codp),
  codr: varchar("codr", { length: 255 }).notNull(),
  denumire: varchar("denumire", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cimitir locuri (burial plots)
export const cimitirLocuri = pgTable("cimitir_locuri", {
  id: uuid("id").primaryKey().defaultRandom(),
  cimitirId: uuid("cimitir_id").references(() => cimitire.id),
  codp: varchar("codp", { length: 255 }).references(() => cimitirParcele.codp),
  codr: varchar("codr", { length: 255 }),
  codl: varchar("codl", { length: 255 }).notNull(),
  detalii: text("detalii"),
  stare: varchar("stare", { length: 255 }),
  nrDecedati: varchar("nr_decedati", { length: 50 }),
  decedati: text("decedati"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cimitir concesiuni (cemetery concessions)
export const cimitirConcesiuni = pgTable("cimitir_concesiuni", {
  id: uuid("id").primaryKey().defaultRandom(),
  cimitirId: uuid("cimitir_id").references(() => cimitire.id),
  codp: varchar("codp", { length: 255 }),
  codr: varchar("codr", { length: 255 }),
  codl: varchar("codl", { length: 255 }),
  tipPartener: varchar("tip_partener", { length: 255 }),
  codPartener: varchar("cod_partener", { length: 255 }),
  nrContract: varchar("nr_contract", { length: 50 }),
  dataContract: date("data_contract"),
  dataExpirare: date("data_expirare"),
  valoareAnuala: numeric("valoare_anuala", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cimitir incasare concesiuni (cemetery concession payments)
export const cimitirIncasareConcesiuni = pgTable("cimitir_incasare_concesiuni", {
  id: uuid("id").primaryKey().defaultRandom(),
  cimitirId: uuid("cimitir_id").references(() => cimitire.id),
  codp: varchar("codp", { length: 255 }),
  codr: varchar("codr", { length: 255 }),
  codl: varchar("codl", { length: 255 }),
  tipPartener: varchar("tip_partener", { length: 255 }),
  codPartener: varchar("cod_partener", { length: 255 }),
  dataPlata: date("data_plata"),
  dataExpirare: date("data_expirare"),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  tipDoc: varchar("tip_doc", { length: 255 }),
  nrDoc: varchar("nr_doc", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cimitir vanzare locuri (cemetery plot sales)
export const cimitirVanzareLocuri = pgTable("cimitir_vanzare_locuri", {
  id: uuid("id").primaryKey().defaultRandom(),
  cimitirId: uuid("cimitir_id").references(() => cimitire.id),
  codp: varchar("codp", { length: 255 }),
  codr: varchar("codr", { length: 255 }),
  codl: varchar("codl", { length: 255 }),
  tipPartener: varchar("tip_partener", { length: 255 }),
  codPartener: varchar("cod_partener", { length: 255 }),
  nrContract: varchar("nr_contract", { length: 50 }),
  dataContract: date("data_contract"),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  dataPlata: date("data_plata"),
  tipDoc: varchar("tip_doc", { length: 255 }),
  nrDoc: varchar("nr_doc", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

