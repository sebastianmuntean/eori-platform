import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { cemeteries } from './cemeteries';
import { parishes } from '../core/parishes';

export const cemeteryParcels = pgTable('cemetery_parcels', {
  id: uuid('id').primaryKey().defaultRandom(),
  cemeteryId: uuid('cemetery_id').notNull().references(() => cemeteries.id),
  parishId: uuid('parish_id').notNull().references(() => parishes.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});




