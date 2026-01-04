import { pgTable, uuid, varchar, text, date, numeric, timestamp, pgEnum, integer } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { clients } from '../clients/clients';
import { users } from '../superadmin/users';
import { warehouses } from './warehouses';
import { products } from './products';
import { invoices } from './invoices';

// Stock movement type enum: in, out, transfer, adjustment, return
export const stockMovementTypeEnum = pgEnum('stock_movement_type', ['in', 'out', 'transfer', 'adjustment', 'return']);

export const stockMovements = pgTable('stock_movements', {
  id: uuid('id').primaryKey().defaultRandom(),
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id, { onDelete: 'cascade' }),
  productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  type: stockMovementTypeEnum('type').notNull(),
  movementDate: date('movement_date').notNull(),
  quantity: numeric('quantity', { precision: 10, scale: 3 }).notNull(),
  unitCost: numeric('unit_cost', { precision: 15, scale: 4 }),
  totalValue: numeric('total_value', { precision: 15, scale: 2 }),
  invoiceId: uuid('invoice_id').references(() => invoices.id, { onDelete: 'set null' }),
  invoiceItemIndex: integer('invoice_item_index'),
  documentType: varchar('document_type', { length: 50 }),
  documentNumber: varchar('document_number', { length: 50 }),
  documentDate: date('document_date'),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  destinationWarehouseId: uuid('destination_warehouse_id').references(() => warehouses.id, { onDelete: 'set null' }),
  notes: text('notes'),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

