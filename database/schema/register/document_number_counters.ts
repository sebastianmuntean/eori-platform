import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core';
import { parishes } from '../core/parishes';
import { documentTypeEnum } from './enums';

export const documentNumberCounters = pgTable('document_number_counters', {
  id: uuid('id').primaryKey().defaultRandom(),
  parishId: uuid('parish_id').notNull().references(() => parishes.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  documentType: documentTypeEnum('document_type').notNull(),
  currentValue: integer('current_value').notNull().default(0),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => ({
  uniqueParishYearType: {
    columns: [table.parishId, table.year, table.documentType],
    name: 'document_number_counters_unique',
  },
}));

