import { pgTable, uuid, varchar, boolean, timestamp, index, unique, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";

/**
 * Account type enum
 */
export const accountTypeEnum = pgEnum("account_type", ["asset", "liability", "equity", "income", "expense"]);

/**
 * Accounts table (Plan de conturi)
 * Chart of accounts for financial management
 */
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").references(() => parishes.id, { onDelete: "cascade" }), // NULL = global account
  
  code: varchar("code", { length: 20 }).notNull(), // 7336, 401, 5121
  name: varchar("name", { length: 255 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  parentCode: varchar("parent_code", { length: 20 }),
  
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false), // Standard BOR accounts
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("accounts_parish_code_unique").on(table.parishId, table.code),
  idxParish: index("idx_accounts_parish").on(table.parishId),
  idxCode: index("idx_accounts_code").on(table.code),
  idxType: index("idx_accounts_type").on(table.type),
  idxActive: index("idx_accounts_active").on(table.isActive),
}));

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
