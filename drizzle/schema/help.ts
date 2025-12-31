import { pgTable, uuid, varchar, text } from "drizzle-orm/pg-core";

// Help system
export const help = pgTable("help", {
  id: uuid("id").primaryKey().defaultRandom(),
  cod1: varchar("cod1", { length: 255 }),
  cod2: varchar("cod2", { length: 255 }),
  cod3: varchar("cod3", { length: 255 }),
  denumire: varchar("denumire", { length: 255 }),
  html: text("html"),
});




