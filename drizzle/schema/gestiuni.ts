import { pgTable, uuid, varchar, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { parohii } from "./parohii";

// Gestiuni (warehouses/management units)
export const gestiuni = pgTable("gestiuni", {
  id: uuid("id").primaryKey().defaultRandom(),
  cod: varchar("cod", { length: 50 }).notNull().unique(),
  denumire: varchar("denumire", { length: 255 }).notNull(),
  descriere: text("descriere"),
  parohieId: uuid("parohie_id").references(() => parohii.id, { onDelete: "set null" }),
  responsabil: varchar("responsabil", { length: 255 }),
  telefon: varchar("telefon", { length: 50 }),
  email: varchar("email", { length: 255 }),
  adresa: text("adresa"),
  activ: boolean("activ").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});




