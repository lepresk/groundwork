/**
 * Single-use tokens sent by email. Only the SHA-256 hash is stored, so a
 * database leak does not expose usable links.
 */
import { index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { id } from './_columns.js';
import { users } from './users.js';

export const AUTH_TOKEN_PURPOSES = ['email_verification', 'password_reset'] as const;
export type AuthTokenPurpose = (typeof AUTH_TOKEN_PURPOSES)[number];

export const authTokens = pgTable(
  'auth_tokens',
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    purpose: text().$type<AuthTokenPurpose>().notNull(),
    tokenHash: text().notNull(),
    expiresAt: timestamp({ withTimezone: true }).notNull(),
    consumedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('auth_tokens_hash_unique').on(table.tokenHash),
    index('auth_tokens_user_purpose_idx').on(table.userId, table.purpose),
  ],
);

export type AuthTokenRow = typeof authTokens.$inferSelect;
