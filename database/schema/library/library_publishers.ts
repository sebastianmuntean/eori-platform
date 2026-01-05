import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';

export const libraryPublishers = pgTable('library_publishers', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').references(() => parishes.id),
  code: varchar('code', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  email: varchar('email', { length: 255 }),
  website: varchar('website', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});






