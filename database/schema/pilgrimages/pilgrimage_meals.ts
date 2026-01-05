import { pgTable, uuid, varchar, text, date, time, timestamp, decimal, pgEnum } from 'drizzle-orm/pg-core';
import { pilgrimages } from './pilgrimages';

// Meal type enum
export const mealTypeEnum = pgEnum('meal_type', [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
]);

export const pilgrimageMeals = pgTable('pilgrimage_meals', {
  id: uuid('id').primaryKey().defaultRandom(),
  pilgrimageId: uuid('pilgrimage_id').notNull().references(() => pilgrimages.id, { onDelete: 'cascade' }),
  mealDate: date('meal_date'),
  mealType: mealTypeEnum('meal_type').notNull(),
  mealTime: time('meal_time'),
  location: varchar('location', { length: 255 }),
  providerName: varchar('provider_name', { length: 255 }),
  menuDescription: text('menu_description'),
  pricePerPerson: decimal('price_per_person', { precision: 10, scale: 2 }),
  dietaryOptions: text('dietary_options'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});



