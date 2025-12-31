import { pgTable, uuid, text, integer, date, timestamp, index, pgEnum } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { users } from "../auth/users";
import { employees } from "./employees";

/**
 * Leave status enum
 */
export const leaveStatusEnum = pgEnum("leave_status", ["pending", "approved", "rejected", "cancelled"]);

/**
 * Leave type enum
 */
export const leaveTypeEnum = pgEnum("leave_type", ["annual", "sick", "unpaid", "maternity", "other"]);

/**
 * Leaves table (Concedii)
 */
export const leaves = pgTable("leaves", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  type: leaveTypeEnum("type").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  status: leaveStatusEnum("status").default("pending"),
  approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
}, (table) => ({
  idxParish: index("idx_leaves_parish").on(table.parishId),
  idxEmployee: index("idx_leaves_employee").on(table.employeeId),
  idxStatus: index("idx_leaves_status").on(table.parishId, table.status),
  idxDates: index("idx_leaves_dates").on(table.parishId, table.startDate, table.endDate),
  idxType: index("idx_leaves_type").on(table.parishId, table.type),
}));

export type Leave = typeof leaves.$inferSelect;
export type NewLeave = typeof leaves.$inferInsert;
