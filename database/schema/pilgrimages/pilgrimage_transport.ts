import { pgTable, uuid, varchar, text, date, time, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { pilgrimages } from './pilgrimages';

// Transport type enum
export const transportTypeEnum = pgEnum('transport_type', [
  'bus',
  'train',
  'plane',
  'car',
  'other',
]);

export const pilgrimageTransport = pgTable('pilgrimage_transport', {
  id: uuid('id').primaryKey().defaultRandom(),
  pilgrimageId: uuid('pilgrimage_id').notNull().references(() => pilgrimages.id, { onDelete: 'cascade' }),
  transportType: transportTypeEnum('transport_type').notNull(),
  departureLocation: varchar('departure_location', { length: 255 }),
  departureDate: date('departure_date'),
  departureTime: time('departure_time'),
  arrivalLocation: varchar('arrival_location', { length: 255 }),
  arrivalDate: date('arrival_date'),
  arrivalTime: time('arrival_time'),
  providerName: varchar('provider_name', { length: 255 }),
  providerContact: varchar('provider_contact', { length: 255 }),
  vehicleDetails: text('vehicle_details'),
  capacity: integer('capacity'),
  pricePerPerson: decimal('price_per_person', { precision: 10, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});



