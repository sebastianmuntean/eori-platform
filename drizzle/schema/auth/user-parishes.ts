import { pgTable, uuid, varchar, boolean, timestamp, index, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { parishes } from "../core/parishes";

/**
 * Access level enum for user-parish relationship
 */
export const accessLevelValues = ["full", "readonly", "limited"] as const;
export type AccessLevel = typeof accessLevelValues[number];

/**
 * User Parishes table
 * Maps users to parishes they have access to (multi-tenant access control)
 */
export const userParishes = pgTable("user_parishes", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  parishId: uuid("parish_id")
    .notNull()
    .references(() => parishes.id, { onDelete: "cascade" }),
  isPrimary: boolean("is_primary").default(false), // User's primary parish
  accessLevel: varchar("access_level", { length: 20 }).default("full"), // full, readonly, limited
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUserParish: unique("user_parishes_unique").on(table.userId, table.parishId),
  idxUser: index("idx_user_parishes_user").on(table.userId),
  idxParish: index("idx_user_parishes_parish").on(table.parishId),
  idxPrimary: index("idx_user_parishes_primary").on(table.userId, table.isPrimary),
}));

export type UserParish = typeof userParishes.$inferSelect;
export type NewUserParish = typeof userParishes.$inferInsert;
