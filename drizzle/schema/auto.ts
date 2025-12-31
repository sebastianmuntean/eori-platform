import { pgTable, uuid, varchar, text, numeric, timestamp, date, serial, integer } from "drizzle-orm/pg-core";

// Auto categorii (vehicle categories)
export const autoCategorii = pgTable("auto_categorii", {
  cod: serial("cod").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Auto marci (vehicle brands)
export const autoMarci = pgTable("auto_marci", {
  cod: serial("cod").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Auto modele (vehicle models)
export const autoModele = pgTable("auto_modele", {
  id: serial("id").primaryKey(),
  idMarca: integer("id_marca").references(() => autoMarci.cod),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Auto tip caroserii (vehicle body types)
export const autoTipCaroserii = pgTable("auto_tip_caroserii", {
  cod: serial("cod").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Auto tip reparatii (repair types)
export const autoTipReparatii = pgTable("auto_tip_reparatii", {
  cod: serial("cod").primaryKey(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
});

// Auto vehicule (vehicles)
export const autoVehicule = pgTable("auto_vehicule", {
  nrInmatriculare: varchar("nr_inmatriculare", { length: 50 }).primaryKey(),
  marca: varchar("marca", { length: 255 }),
  model: varchar("model", { length: 255 }),
  anFabricatie: varchar("an_fabricatie", { length: 255 }),
  anAchizitie: varchar("an_achizitie", { length: 255 }),
  categorie: varchar("categorie", { length: 255 }),
  tipCaroserie: varchar("tip_caroserie", { length: 255 }),
  serieSasiu: varchar("serie_sasiu", { length: 255 }),
  serieMotor: varchar("serie_motor", { length: 255 }),
  putereKw: varchar("putere_kw", { length: 255 }),
  cc: varchar("cc", { length: 255 }),
  consumMediu: varchar("consum_mediu", { length: 255 }),
  consumUrban: varchar("consum_urban", { length: 255 }),
  consumExtraurban: varchar("consum_extraurban", { length: 255 }),
  culoare: varchar("culoare", { length: 255 }),
  descriere: text("descriere"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Auto asigurari (vehicle insurance)
export const autoAsigurari = pgTable("auto_asigurari", {
  id: uuid("id").primaryKey().defaultRandom(),
  nrInmatriculare: varchar("nr_inmatriculare", { length: 50 }).references(() => autoVehicule.nrInmatriculare),
  tipAsigurare: varchar("tip_asigurare", { length: 255 }),
  datai: date("datai"),
  dataf: date("dataf"),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  societate: varchar("societate", { length: 255 }),
  tipDocPlata: varchar("tip_doc_plata", { length: 255 }),
  nrDocPlata: varchar("nr_doc_plata", { length: 50 }),
  dataDocPlata: date("data_doc_plata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Auto ITP (technical inspection)
export const autoItp = pgTable("auto_itp", {
  id: uuid("id").primaryKey().defaultRandom(),
  nrInmatriculare: varchar("nr_inmatriculare", { length: 50 }).references(() => autoVehicule.nrInmatriculare),
  datai: date("datai"),
  dataf: date("dataf"),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  societate: varchar("societate", { length: 255 }),
  tipDocPlata: varchar("tip_doc_plata", { length: 255 }),
  nrDocPlata: varchar("nr_doc_plata", { length: 50 }),
  dataDocPlata: date("data_doc_plata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Auto reparatii (vehicle repairs)
export const autoReparatii = pgTable("auto_reparatii", {
  id: uuid("id").primaryKey().defaultRandom(),
  nrInmatriculare: varchar("nr_inmatriculare", { length: 50 }).references(() => autoVehicule.nrInmatriculare),
  datai: date("datai"),
  tipReparatie: varchar("tip_reparatie", { length: 255 }),
  kilometraj: varchar("kilometraj", { length: 255 }),
  durata: varchar("durata", { length: 255 }),
  descriere: text("descriere"),
  valoareManopera: numeric("valoare_manopera", { precision: 10, scale: 2 }),
  valoarePiese: numeric("valoare_piese", { precision: 10, scale: 2 }),
  societate: varchar("societate", { length: 255 }),
  calificativ: varchar("calificativ", { length: 255 }),
  tipDocPlata: varchar("tip_doc_plata", { length: 255 }),
  nrDocPlata: varchar("nr_doc_plata", { length: 50 }),
  dataDocPlata: date("data_doc_plata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});




