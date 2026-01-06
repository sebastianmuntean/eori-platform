import { pgTable, uuid, varchar, text, boolean, integer, numeric, date, timestamp } from 'drizzle-orm/pg-core';
import { deaneries } from './deaneries';
import { dioceses } from './dioceses';

export const parishes = pgTable('parishes', {
  id: uuid('id').primaryKey().defaultRandom(),
  deaneryId: uuid('deanery_id').references(() => deaneries.id),
  dioceseId: uuid('diocese_id').notNull().references(() => dioceses.id),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  patronSaintDay: date('patron_saint_day'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  postalCode: varchar('postal_code', { length: 20 }),
  latitude: numeric('latitude', { precision: 10, scale: 8 }),
  longitude: numeric('longitude', { precision: 11, scale: 8 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  priestName: varchar('priest_name', { length: 255 }),
  vicarName: varchar('vicar_name', { length: 255 }),
  parishionerCount: integer('parishioner_count'),
  foundedYear: integer('founded_year'),
  notes: text('notes'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});










