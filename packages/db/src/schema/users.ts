/**
 * `users`: every authenticated identity. Email uniqueness is enforced
 * case-insensitively through a functional index.
 */
import { sql } from 'drizzle-orm';
import { pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_columns.js';

export const users = pgTable(
  'users',
  {
    id: id(),
    email: text().notNull(),
    passwordHash: text().notNull(),
    firstName: text().notNull(),
    lastName: text().notNull(),
    emailVerifiedAt: timestamp({ withTimezone: true }),
    passwordChangedAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex('users_email_lower_unique').on(sql`lower(${table.email})`)],
);

export type UserRow = typeof users.$inferSelect;
