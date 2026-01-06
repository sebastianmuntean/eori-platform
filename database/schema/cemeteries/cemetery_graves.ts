import { pgTable, uuid, varchar, text, numeric, integer, timestamp, pgEnum } from 'drizzle-orm/pg-core';
import { cemeteryRows } from './cemetery_rows';
import { cemeteryParcels } from './cemetery_parcels';
import { cemeteries } from './cemeteries';
import { parishes } from '../core/parishes';

export const graveStatusEnum = pgEnum('grave_status', ['free', 'occupied', 'reserved', 'maintenance']);

export const cemeteryGraves = pgTable('cemetery_graves', {
  id: uuid('id').primaryKey().defaultRandom(),
  rowId: uuid('row_id').notNull().references(() => cemeteryRows.id),
  parcelId: uuid('parcel_id').notNull().references(() => cemeteryParcels.id),
  cemeteryId: uuid('cemetery_id').notNull().references(() => cemeteries.id),
  parishId: uuid('parish_id').notNull().references(() => parishes.id),
  code: varchar('code', { length: 20 }).notNull(),
  status: graveStatusEnum('status').default('free'),
  width: numeric('width', { precision: 5, scale: 2 }),
  length: numeric('length', { precision: 5, scale: 2 }),
  positionX: integer('position_x'),
  positionY: integer('position_y'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});










