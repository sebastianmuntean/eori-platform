import { pgTable, uuid, varchar, text, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { parohii } from "./parohii";

// Registru botezuri (baptism register)
export const rbotezuri = pgTable("rbotezuri", {
  id: uuid("id").primaryKey().defaultRandom(),
  parohieId: uuid("parohie_id").references(() => parohii.id),
  nrCb: varchar("nr_cb", { length: 50 }),
  dataCb: date("data_cb"),
  nrCn: varchar("nr_cn", { length: 50 }),
  dataCn: date("data_cn"),
  cnp: varchar("cnp", { length: 255 }),
  eliberatDeCn: varchar("eliberat_de_cn", { length: 255 }),
  dataNasterii: date("data_nasterii"),
  dataBotezului: date("data_botezului"),
  numeBotezat: varchar("nume_botezat", { length: 255 }).notNull(),
  legitim: varchar("legitim", { length: 255 }),
  parinti: varchar("parinti", { length: 255 }),
  profesiaParinti: varchar("profesia_parinti", { length: 255 }),
  adresaParinti: text("adresa_parinti"),
  nasi: varchar("nasi", { length: 255 }),
  adresaNasi: text("adresa_nasi"),
  tipDoc: varchar("tip_doc", { length: 255 }),
  nrDoc: varchar("nr_doc", { length: 50 }),
  dataDoc: date("data_doc"),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Registru cununii (marriage register)
export const rcununii = pgTable("rcununii", {
  id: uuid("id").primaryKey().defaultRandom(),
  parohieId: uuid("parohie_id").references(() => parohii.id),
  nrCununie: varchar("nr_ccununie", { length: 50 }),
  dataCununie: date("data_ccununie"),
  nrCcasatorie: varchar("nr_ccasatorie", { length: 50 }),
  dataCcasatorie: date("data_ccasatorie"),
  eliberatDeCcasatorie: varchar("eliberat_de_ccasatorie", { length: 255 }),
  numeMire: varchar("nume_mire", { length: 255 }).notNull(),
  stareCivilaMire: varchar("stare_civila_mire", { length: 255 }),
  varstaMire: varchar("varsta_mire", { length: 255 }),
  numeMireasa: varchar("nume_mireasa", { length: 255 }).notNull(),
  stareCivilaMireasa: varchar("stare_civila_mireasa", { length: 255 }),
  varstaMireasa: varchar("varsta_mireasa", { length: 255 }),
  adresaMiri: text("adresa_miri"),
  nasi: varchar("nasi", { length: 255 }),
  adresaNasi: text("adresa_nasi"),
  observatii: text("observatii"),
  tipDoc: varchar("tip_doc", { length: 255 }),
  nrDoc: varchar("nr_doc", { length: 50 }),
  dataDoc: date("data_doc"),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Registru inmormantari (funeral register)
export const rinmormantari = pgTable("rinmormantari", {
  id: uuid("id").primaryKey().defaultRandom(),
  parohieId: uuid("parohie_id").references(() => parohii.id),
  nrCd: varchar("nr_cd", { length: 50 }),
  dataCd: date("data_cd"),
  eliberatDeCd: varchar("eliberat_de_cd", { length: 255 }),
  decedat: varchar("decedat", { length: 255 }).notNull(),
  sex: varchar("sex", { length: 255 }),
  varsta: varchar("varsta", { length: 255 }),
  profesia: varchar("profesia", { length: 255 }),
  cauzaMortii: varchar("cauza_mortii", { length: 255 }),
  dataInmormantarii: date("data_inmormantarii"),
  dataMortii: date("data_mortii"),
  loculInmormantarii: varchar("locul_inmormantarii", { length: 255 }),
  tipDoc: varchar("tip_doc", { length: 255 }),
  nrDoc: varchar("nr_doc", { length: 50 }),
  dataDoc: date("data_doc"),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Registru chitantiere (receipt book register)
export const rchitantiere = pgTable("rchitantiere", {
  id: uuid("id").primaryKey().defaultRandom(),
  parohieId: uuid("parohie_id").references(() => parohii.id),
  nrCrt: varchar("nr_crt", { length: 50 }),
  dataIntrarii: date("data_intrarii"),
  serie: varchar("serie", { length: 255 }),
  nri: varchar("nri", { length: 255 }),
  nrf: varchar("nrf", { length: 255 }),
  datai: date("datai"),
  dataf: date("dataf"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Registru in/out (entry/exit register)
export const rinout = pgTable("rinout", {
  id: uuid("id").primaryKey().defaultRandom(),
  parohieId: uuid("parohie_id").references(() => parohii.id),
  tip: varchar("tip", { length: 255 }),
  nrInregistrare: varchar("nr_inregistrare", { length: 50 }),
  data: date("data"),
  partener: varchar("partener", { length: 255 }),
  nrInregistrarePartener: varchar("nr_inregistrare_partener", { length: 50 }),
  continut: text("continut"),
  observatii: text("observatii"),
  anul: varchar("anul", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});




