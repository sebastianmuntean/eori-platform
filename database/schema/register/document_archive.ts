import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { documentRegistry } from './document_registry';
import { users } from '../superadmin/users';

export const documentArchive = pgTable('document_archive', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documentRegistry.id, { onDelete: 'cascade' }),
  archiveIndicator: varchar('archive_indicator', { length: 50 }),
  archiveTerm: varchar('archive_term', { length: 50 }),
  archiveLocation: varchar('archive_location', { length: 255 }),
  archivedBy: uuid('archived_by').notNull().references(() => users.id),
  archivedAt: timestamp('archived_at', { withTimezone: true }).notNull().defaultNow(),
});

