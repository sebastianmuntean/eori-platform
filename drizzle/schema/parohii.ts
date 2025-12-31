import { pgTable, uuid, varchar, text, boolean, integer, timestamp } from "drizzle-orm/pg-core";

// Parohii table
export const parohii = pgTable("parohii", {
  id: uuid("id").primaryKey().defaultRandom(),
  cod: varchar("cod", { length: 50 }).notNull().unique(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  adresa: text("adresa"),
  localitate: varchar("localitate", { length: 255 }),
  judet: varchar("judet", { length: 255 }),
  telefon: varchar("telefon", { length: 50 }),
  email: varchar("email", { length: 255 }),
  preotParoh: varchar("preot_paroh", { length: 255 }),
  preotVicar: varchar("preot_vicar", { length: 255 }),
  nrEnoriasi: integer("nr_enoriasi"),
  observatii: text("observatii"),
  activ: boolean("activ").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});




