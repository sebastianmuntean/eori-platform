import { pgTable, uuid, varchar, text, numeric, timestamp, date, serial, integer } from "drizzle-orm/pg-core";

// Biblioteca autori (library authors)
export const bibliotecaAutori = pgTable("biblioteca_autori", {
  coda: varchar("coda", { length: 255 }).primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Biblioteca edituri (library publishers)
export const bibliotecaEdituri = pgTable("biblioteca_edituri", {
  code: varchar("code", { length: 255 }).primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Biblioteca domenii (library domains/subjects)
export const bibliotecaDomenii = pgTable("biblioteca_domenii", {
  codd: varchar("codd", { length: 255 }).primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Biblioteca stari (library conservation states)
export const bibliotecaStari = pgTable("biblioteca_stari", {
  cod: serial("cod").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Biblioteca sali (library rooms)
export const bibliotecaSali = pgTable("biblioteca_sali", {
  cods: varchar("cods", { length: 255 }).primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Biblioteca rafturi (library shelves)
export const bibliotecaRafturi = pgTable("biblioteca_rafturi", {
  id: uuid("id").primaryKey().defaultRandom(),
  cods: varchar("cods", { length: 255 }).references(() => bibliotecaSali.cods),
  codr: varchar("codr", { length: 255 }).notNull(),
  denumire: varchar("denumire", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Biblioteca carti (library books)
export const bibliotecaCarti = pgTable("biblioteca_carti", {
  codc: varchar("codc", { length: 255 }).primaryKey(),
  cods: varchar("cods", { length: 255 }).references(() => bibliotecaSali.cods),
  codr: varchar("codr", { length: 255 }),
  pozitie: varchar("pozitie", { length: 255 }),
  editura: varchar("editura", { length: 255 }),
  domeniu: varchar("domeniu", { length: 255 }),
  autor: varchar("autor", { length: 255 }),
  titlu: varchar("titlu", { length: 255 }).notNull(),
  isbn: varchar("isbn", { length: 255 }),
  descriere: text("descriere"),
  anulAparitiei: varchar("anul_aparitiei", { length: 255 }),
  nrExemplare: varchar("nr_exemplare", { length: 50 }),
  imprumutabila: varchar("imprumutabila", { length: 255 }),
  stare: varchar("stare", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Biblioteca abonamente (library subscriptions)
export const bibliotecaAbonamente = pgTable("biblioteca_abonamente", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipPartener: varchar("tip_partener", { length: 255 }),
  codPartener: varchar("cod_partener", { length: 255 }),
  nrAbonament: varchar("nr_abonament", { length: 50 }),
  dataAbonament: date("data_abonament"),
  valoareLunara: numeric("valoare_lunara", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Biblioteca incasare abonamente (library subscription payments)
export const bibliotecaIncasareAbonamente = pgTable("biblioteca_incasare_abonamente", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipPartener: varchar("tip_partener", { length: 255 }),
  codPartener: varchar("cod_partener", { length: 255 }),
  data: date("data"),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  dataValabilitate: date("data_valabilitate"),
  tipDoc: varchar("tip_doc", { length: 255 }),
  nrDoc: varchar("nr_doc", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Biblioteca imprumuturi (library loans)
export const bibliotecaImprumuturi = pgTable("biblioteca_imprumuturi", {
  id: uuid("id").primaryKey().defaultRandom(),
  codc: varchar("codc", { length: 255 }).references(() => bibliotecaCarti.codc),
  tipPartener: varchar("tip_partener", { length: 255 }),
  codPartener: varchar("cod_partener", { length: 255 }),
  dataImprumut: date("data_imprumut"),
  dataEstimataReturnare: date("data_estimata_returnare"),
  dataReturnare: date("data_returnare"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});




