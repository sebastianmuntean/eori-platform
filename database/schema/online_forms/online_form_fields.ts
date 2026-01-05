import { pgTable, uuid, varchar, text, boolean, integer, timestamp, pgEnum, jsonb } from 'drizzle-orm/pg-core';
import { onlineForms } from './online_forms';

// Form field type enum
export const formFieldTypeEnum = pgEnum('form_field_type', [
  'text',
  'email',
  'textarea',
  'select',
  'date',
  'number',
  'file',
]);

export const onlineFormFields = pgTable('online_form_fields', {
  id: uuid('id').primaryKey().defaultRandom(),
  formId: uuid('form_id').notNull().references(() => onlineForms.id, { onDelete: 'cascade' }),
  fieldKey: varchar('field_key', { length: 100 }).notNull(),
  fieldType: formFieldTypeEnum('field_type').notNull(),
  label: varchar('label', { length: 255 }).notNull(),
  placeholder: varchar('placeholder', { length: 255 }),
  helpText: text('help_text'),
  isRequired: boolean('is_required').notNull().default(false),
  validationRules: jsonb('validation_rules'), // JSON object with validation rules
  options: jsonb('options'), // JSON array for select fields: [{value, label}]
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});




