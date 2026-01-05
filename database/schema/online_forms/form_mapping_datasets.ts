import { pgTable, uuid, varchar, text, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { users } from '../superadmin/users';
import { formTargetModuleEnum } from './online_forms';


export const formMappingDatasets = pgTable('form_mapping_datasets', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetModule: formTargetModuleEnum('target_module').notNull(),
  parishId: uuid('parish_id').references(() => parishes.id, { onDelete: 'set null' }), // null = template global
  isDefault: boolean('is_default').notNull().default(false),
  mappings: jsonb('mappings').notNull().$defaultFn(() => []), // Array de mapări configurate
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});

