import { pgTable, uuid, varchar, text, timestamp, pgEnum, boolean, unique } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

// Warehouse type enum: general, retail, storage, temporary
export const warehouseTypeEnum = pgEnum('warehouse_type', ['general', 'retail', 'storage', 'temporary']);

export const warehouses = pgTable('warehouses', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: warehouseTypeEnum('type').notNull().default('general'),
  address: text('address'),
  responsibleName: varchar('responsible_name', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  invoiceSeries: varchar('invoice_series', { length: 20 }),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  uniqueParishCode: unique().on(table.parishId, table.code),
}));

