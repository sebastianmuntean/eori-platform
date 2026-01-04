import { pgTable, uuid, varchar, date, text, numeric, timestamp, uuid as uuidType } from 'drizzle-orm/pg-core';
import { cemeteryGraves } from './cemetery_graves';
import { cemeteries } from './cemeteries';
import { parishes } from '../core/parishes';
import { clients } from '../clients/clients';
import { users } from '../superadmin/users';

export const burials = pgTable('burials', {
  id: uuid('id').primaryKey().defaultRandom(),
  graveId: uuid('grave_id').notNull().references(() => cemeteryGraves.id),
  cemeteryId: uuid('cemetery_id').notNull().references(() => cemeteries.id),
  parishId: uuid('parish_id').notNull().references(() => parishes.id),
  deceasedClientId: uuid('deceased_client_id').references(() => clients.id),
  deceasedName: varchar('deceased_name', { length: 255 }).notNull(),
  deceasedBirthDate: date('deceased_birth_date'),
  deceasedDeathDate: date('deceased_death_date').notNull(),
  burialDate: date('burial_date').notNull(),
  burialCertificateNumber: varchar('burial_certificate_number', { length: 50 }),
  burialCertificateDate: date('burial_certificate_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid('updated_by').references(() => users.id),
});




