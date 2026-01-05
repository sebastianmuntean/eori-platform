import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core';
import { documentRegistry } from './document_registry';
import { connectionTypeEnum } from './enums';

export const documentConnections = pgTable('document_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documentRegistry.id, { onDelete: 'cascade' }),
  connectedDocumentId: uuid('connected_document_id').notNull().references(() => documentRegistry.id, { onDelete: 'cascade' }),
  connectionType: connectionTypeEnum('connection_type').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

