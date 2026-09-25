/**
 * `auth_sessions`: server-side registry backing every session cookie.
 * The cookie only carries the row id; revocation and idle expiry are
 * enforced here so a stolen cookie can be killed server-side.
 */
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id } from './_columns.js';
import { users } from './users.js';

export const authSessions = pgTable(
  'auth_sessions',
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    ipAddress: text(),
    userAgent: text(),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    lastActivityAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    revokedAt: timestamp({ withTimezone: true }),
  },
  (table) => [index('auth_sessions_user_active_idx').on(table.userId, table.revokedAt)],
);

export type AuthSessionRow = typeof authSessions.$inferSelect;
