import { pgTable, uuid, varchar, text, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Warehouses table (Gestiuni/Depozite)
 * Storage locations for inventory management
 */
export const warehouses = pgTable("warehouses", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  
  code: varchar("code", { length: 20 }).notNull(), // GEST-001
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).default("general"), // pangar, materials, store
  
  address: text("address"),
  responsibleName: varchar("responsible_name", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  
  // Stock configuration
  stockMethod: varchar("stock_method", { length: 10 }).default("FIFO"), // FIFO, LIFO, AVG
  allowNegativeStock: boolean("allow_negative_stock").default(false),
  
  isActive: boolean("is_active").default(true),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("warehouses_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_warehouses_parish").on(table.parishId),
  idxActive: index("idx_warehouses_active").on(table.parishId, table.isActive),
  idxType: index("idx_warehouses_type").on(table.parishId, table.type),
}));

export type Warehouse = typeof warehouses.$inferSelect;
export type NewWarehouse = typeof warehouses.$inferInsert;
