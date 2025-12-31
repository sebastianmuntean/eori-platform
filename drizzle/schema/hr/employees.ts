import { pgTable, uuid, varchar, boolean, decimal, date, timestamp, index, unique } from "drizzle-orm/pg-core";
import { parishes } from "../core/parishes";
import { partners } from "../core/partners";

/**
 * Employees table
 * Staff management linked to partners
 */
export const employees = pgTable("employees", {
  id: uuid("id").defaultRandom().primaryKey(),
  parishId: uuid("parish_id").notNull().references(() => parishes.id, { onDelete: "cascade" }),
  partnerId: uuid("partner_id").notNull().references(() => partners.id, { onDelete: "restrict" }), // Link to partner
  employeeCode: varchar("employee_code", { length: 50 }).notNull(),
  position: varchar("position", { length: 255 }),
  department: varchar("department", { length: 100 }),
  hireDate: date("hire_date").notNull(),
  terminationDate: date("termination_date"),
  contractType: varchar("contract_type", { length: 50 }), // full_time, part_time, contract
  salary: decimal("salary", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueParishCode: unique("employees_parish_code_unique").on(table.parishId, table.employeeCode),
  idxParish: index("idx_employees_parish").on(table.parishId),
  idxPartner: index("idx_employees_partner").on(table.partnerId),
  idxActive: index("idx_employees_active").on(table.parishId, table.isActive),
  idxDepartment: index("idx_employees_department").on(table.parishId, table.department),
}));

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
