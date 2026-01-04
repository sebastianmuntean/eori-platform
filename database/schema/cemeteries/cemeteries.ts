import { pgTable, uuid, varchar, text, boolean, numeric, integer, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

export const cemeteries = pgTable('cemeteries', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  totalArea: numeric('total_area', { precision: 10, scale: 2 }),
  totalPlots: integer('total_plots'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});




