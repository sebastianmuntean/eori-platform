import { pgTable, uuid, varchar, text, date, numeric, timestamp, integer, pgEnum, unique } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

// Asset status enum
export const assetStatusEnum = pgEnum('asset_status', ['active', 'inactive', 'disposed', 'damaged']);

export const fixedAssets = pgTable('fixed_assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  inventoryNumber: varchar('inventory_number', { length: 50 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  type: varchar('type', { length: 100 }),
  location: varchar('location', { length: 255 }),
  acquisitionDate: date('acquisition_date'),
  acquisitionValue: numeric('acquisition_value', { precision: 15, scale: 2 }),
  currentValue: numeric('current_value', { precision: 15, scale: 2 }),
  depreciationMethod: varchar('depreciation_method', { length: 20 }),
  usefulLifeYears: integer('useful_life_years'),
  status: assetStatusEnum('status').default('active'),
  disposalDate: date('disposal_date'),
  disposalValue: numeric('disposal_value', { precision: 15, scale: 2 }),
  disposalReason: text('disposal_reason'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueParishInventory: unique().on(table.parishId, table.inventoryNumber),
}));







