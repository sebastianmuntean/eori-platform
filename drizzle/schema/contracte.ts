import { pgTable, uuid, varchar, text, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { parohii } from "./parohii";

// Contracte (contracts)
export const contracte = pgTable("contracte", {
  id: uuid("id").primaryKey().defaultRandom(),
  nr: varchar("nr", { length: 255 }).notNull(),
  data: date("data"),
  nrPartener: varchar("nr_partener", { length: 50 }),
  dataPartener: date("data_partener"),
  codPartener: varchar("cod_partener", { length: 255 }),
  valoare: numeric("valoare", { precision: 10, scale: 2 }),
  obiect: text("obiect"),
  parohieId: uuid("parohie_id").references(() => parohii.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Contracte documente (contract documents)
export const contracteDocumente = pgTable("contracte_documente", {
  idDoc: uuid("id_doc").primaryKey().defaultRandom(),
  nr: varchar("nr", { length: 255 }),
  data: date("data"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});




