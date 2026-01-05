import { pgTable, uuid, varchar, text, date, timestamp, pgEnum, numeric } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { warehouses } from './warehouses';
import { users } from '../superadmin/users';

// Inventory session status enum
export const inventorySessionStatusEnum = pgEnum('inventory_session_status', ['draft', 'in_progress', 'completed', 'cancelled']);

// Inventory item type enum
export const inventoryItemTypeEnum = pgEnum('inventory_item_type', ['product', 'fixed_asset']);

export const inventorySessions = pgTable('inventory_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  warehouseId: uuid('warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
  date: date('date').notNull(),
  status: inventorySessionStatusEnum('status').notNull().default('draft'),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryItems = pgTable('inventory_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => inventorySessions.id, { onDelete: 'cascade' }),
  itemType: inventoryItemTypeEnum('item_type').notNull(),
  itemId: uuid('item_id').notNull(), // productId or fixedAssetId
  bookQuantity: numeric('book_quantity', { precision: 10, scale: 3 }),
  physicalQuantity: numeric('physical_quantity', { precision: 10, scale: 3 }),
  difference: numeric('difference', { precision: 10, scale: 3 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

