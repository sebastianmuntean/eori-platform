import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";

// Previziuni (budget forecasts)
export const previziuni = pgTable("previziuni", {
  id: uuid("id").primaryKey().defaultRandom(),
  anul: varchar("anul", { length: 255 }).notNull(),
  cont: varchar("cont", { length: 255 }),
  total: varchar("total", { length: 255 }),
  trim1: varchar("trim1", { length: 255 }),
  trim2: varchar("trim2", { length: 255 }),
  trim3: varchar("trim3", { length: 255 }),
  trim4: varchar("trim4", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});




