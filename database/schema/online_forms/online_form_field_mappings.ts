import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { onlineForms } from './online_forms';

export const onlineFormFieldMappings = pgTable('online_form_field_mappings', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull().references(() => onlineForms.id, { onDelete: 'cascade' }),
  fieldKey: varchar('field_key', { length: 100 }).notNull(),
  targetTable: varchar('target_table', { length: 100 }).notNull(),
  targetColumn: varchar('target_column', { length: 100 }).notNull(),
  transformation: jsonb('transformation'), // JSON object with transformation rules (optional)
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});








