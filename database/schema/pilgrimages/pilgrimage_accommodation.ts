import { pgTable, uuid, varchar, text, date, timestamp, integer, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { pilgrimages } from './pilgrimages';

// Accommodation type enum
export const accommodationTypeEnum = pgEnum('accommodation_type', [
  'hotel',
  'monastery',
  'hostel',
  'other',
]);

// Room type enum
export const roomTypeEnum = pgEnum('room_type', [
  'single',
  'double',
  'triple',
  'quad',
  'dormitory',
]);

export const pilgrimageAccommodation = pgTable('pilgrimage_accommodation', {
  id: uuid('id').primaryKey().defaultRandom(),
  pilgrimageId: uuid('pilgrimage_id').notNull().references(() => pilgrimages.id, { onDelete: 'cascade' }),
  accommodationName: varchar('accommodation_name', { length: 255 }),
  accommodationType: accommodationTypeEnum('accommodation_type'),
  address: text('address'),
  city: varchar('city', { length: 100 }),
  county: varchar('county', { length: 100 }),
  country: varchar('country', { length: 100 }),
  checkInDate: date('check_in_date'),
  checkOutDate: date('check_out_date'),
  roomType: roomTypeEnum('room_type'),
  totalRooms: integer('total_rooms'),
  pricePerNight: decimal('price_per_night', { precision: 10, scale: 2 }),
  contactName: varchar('contact_name', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});



