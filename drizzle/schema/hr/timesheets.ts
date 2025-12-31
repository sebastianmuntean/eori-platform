import { pgTable, uuid, text, boolean, decimal, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { employees } from "./employees";

/**
 * Timesheets table (Pontaje)
 * Daily attendance tracking
 */
export const timesheets = pgTable("timesheets", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  hoursWorked: decimal("hours_worked", { precision: 4, scale: 2 }),
  isPresent: boolean("is_present").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueEmployeeDate: unique("timesheets_employee_date_unique").on(table.employeeId, table.date),
  idxParish: index("idx_timesheets_parish").on(table.parishId),
  idxEmployee: index("idx_timesheets_employee").on(table.employeeId),
  idxDate: index("idx_timesheets_date").on(table.parishId, table.date),
}));

export type Timesheet = typeof timesheets.$inferSelect;
export type NewTimesheet = typeof timesheets.$inferInsert;
