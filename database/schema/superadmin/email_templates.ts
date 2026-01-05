import { pgTable, text, timestamp, uuid, boolean, pgEnum, jsonb, unique } from 'drizzle-orm/pg-core';

// Template category enum
export const templateCategoryEnum = pgEnum('template_category', [
  'predefined',
  'custom',
]);

// Email templates table
export const emailTemplates = pgTable('email_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content'), // Optional plain text version
  variables: jsonb('variables').$type<string[]>().notNull().default([]), // Array of variable names used in template
  category: templateCategoryEnum('category').notNull().default('custom'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueTemplateName: unique().on(table.name),
}));


