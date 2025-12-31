import { pgTable, uuid, integer, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { documentDirectionEnum } from "./documents";

/**
 * Document Number Counters table
 * Ensures atomic numbering for documents per parish/year/direction
 */
export const documentNumberCounters = pgTable("document_number_counters", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  year: integer("year").notNull(),
  direction: documentDirectionEnum("direction").notNull(),
  currentValue: integer("current_value").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueCounter: unique("document_number_counters_unique").on(table.parishId, table.year, table.direction),
  idxParishYear: index("idx_doc_counters_parish_year").on(table.parishId, table.year),
}));

export type DocumentNumberCounter = typeof documentNumberCounters.$inferSelect;
export type NewDocumentNumberCounter = typeof documentNumberCounters.$inferInsert;
