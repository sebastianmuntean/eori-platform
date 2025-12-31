import { pgTable, timestamp, uuid, unique } from 'drizzle-orm/pg-core';
import { users } from './users';
import { roles } from './roles';

export const userRoles = pgTable('user_roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  roleId: uuid('role_id')
    .notNull()
    .references(() => roles.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  uniqueUserRole: unique().on(table.userId, table.roleId),
}));

