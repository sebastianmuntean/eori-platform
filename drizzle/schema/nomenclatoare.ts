import { pgTable, uuid, varchar, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";

// Const domenii (domains/areas)
export const constDomenii = pgTable("const_domenii", {
  cod: serial("cod").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Const judete (counties)
export const constJudete = pgTable("const_judete", {
  idj: serial("idj").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Const localitati tipuri (locality types)
export const constLocalitatiTipuri = pgTable("const_localitati_tipuri", {
  id: serial("id").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Const localitati (localities)
export const constLocalitati = pgTable("const_localitati", {
  id: uuid("id").primaryKey().defaultRandom(),
  idj: integer("idj").references(() => constJudete.idj),
  idl: integer("idl"),
  idu: integer("idu").references(() => constLocalitatiTipuri.id),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  tip: varchar("tip", { length: 255 }),
});

// Const serii ch (receipt series)
export const constSeriiCh = pgTable("const_serii_ch", {
  serie: varchar("serie", { length: 255 }).primaryKey(),
  nri: varchar("nri", { length: 255 }),
  nrf: varchar("nrf", { length: 255 }),
  nrc: varchar("nrc", { length: 255 }),
});

// Const serii bp (payment voucher series)
export const constSeriiBp = pgTable("const_serii_bp", {
  serie: varchar("serie", { length: 255 }).primaryKey(),
  nri: varchar("nri", { length: 255 }),
  nrf: varchar("nrf", { length: 255 }),
  nrc: varchar("nrc", { length: 255 }),
});

// Const xml data
export const constXmlData = pgTable("const_xml_data", {
  denumire: varchar("denumire", { length: 255 }).primaryKey(),
  xmldata: text("xmldata"),
});

// Parteneri (partners/families/clients)
export const parteneri = pgTable("parteneri", {
  id: uuid("id").primaryKey().defaultRandom(),
  tip: varchar("tip", { length: 255 }),
  cod: serial("cod").unique(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  cif: varchar("cif", { length: 255 }),
  rc: varchar("rc", { length: 255 }),
  banca: varchar("banca", { length: 255 }),
  iban: varchar("iban", { length: 255 }),
  idj: integer("idj"),
  idl: integer("idl"),
  adresa: text("adresa"),
  nume: varchar("nume", { length: 255 }),
  prenume: varchar("prenume", { length: 255 }),
  telefon: varchar("telefon", { length: 255 }),
  email: varchar("email", { length: 255 }),
  observatii: text("observatii"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Enoriasi clasificare (parishioner classification)
export const enoriasiClasificare = pgTable("enoriasi_clasificare", {
  cod: serial("cod").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Enoriasi (parishioners)
export const enoriasi = pgTable("enoriasi", {
  id: uuid("id").primaryKey().defaultRandom(),
  tipPartener: varchar("tip_partener", { length: 255 }),
  codPartener: varchar("cod_partener", { length: 255 }),
  cod: serial("cod").unique(),
  nume: varchar("nume", { length: 255 }).notNull(),
  prenume: varchar("prenume", { length: 255 }),
  dataNasterii: timestamp("data_nasterii", { withTimezone: true }),
  profesie: varchar("profesie", { length: 255 }),
  ocupatie: varchar("ocupatie", { length: 255 }),
  stareCivila: varchar("stare_civila", { length: 255 }),
  telefon: varchar("telefon", { length: 255 }),
  email: varchar("email", { length: 255 }),
  observatii: text("observatii"),
  clasificare: varchar("clasificare", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Plan conturi definitii (chart of accounts definitions)
export const planctDefinitii = pgTable("planct_definitii", {
  cod: serial("cod").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  simbol: varchar("simbol", { length: 255 }),
});

// Plan conturi (chart of accounts)
export const planct = pgTable("planct", {
  simbol: varchar("simbol", { length: 255 }).primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  tip: varchar("tip", { length: 255 }),
  grup: varchar("grup", { length: 255 }),
  procent: varchar("procent", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Produse (products/goods)
export const produse = pgTable("produse", {
  id: uuid("id").primaryKey().defaultRandom(),
  codDomeniu: varchar("cod_domeniu", { length: 255 }),
  codProdus: varchar("cod_produs", { length: 255 }).notNull(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  um: varchar("um", { length: 255 }),
  pretAchizitie: numeric("pret_achizitie", { precision: 10, scale: 2 }),
  pretVanzare: numeric("pret_vanzare", { precision: 10, scale: 2 }),
  contCheltuieli: varchar("cont_cheltuieli", { length: 255 }),
  contVenituri: varchar("cont_venituri", { length: 255 }),
  cotaTva: numeric("cota_tva", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

