import { pgTable, uuid, varchar, text, numeric, timestamp, boolean, unique } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';

export const products = pgTable('products', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  code: varchar('code', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  unit: varchar('unit', { length: 20 }).notNull().default('pcs'),
  purchasePrice: numeric('purchase_price', { precision: 15, scale: 2 }),
  salePrice: numeric('sale_price', { precision: 15, scale: 2 }),
  vatRate: numeric('vat_rate', { precision: 5, scale: 2 }).default('19'),
  barcode: varchar('barcode', { length: 100 }),
  trackStock: boolean('track_stock').default(true),
  minStock: numeric('min_stock', { precision: 10, scale: 3 }),
  isActive: boolean('is_active').default(true),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
}, (table) => ({
  uniqueParishCode: unique().on(table.parishId, table.code),
}));

