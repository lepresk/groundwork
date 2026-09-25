/**
 * TOTP two-factor credentials. A row with `enabledAt = null` is a pending
 * setup that becomes active once the user proves possession of the secret.
 * The secret is encrypted at rest (AES-256-GCM); recovery codes are hashed.
 */
import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_columns.js';
import { users } from './users.js';

export const twoFactorCredentials = pgTable('two_factor_credentials', {
  userId: uuid()
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  encryptedSecret: text().notNull(),
  enabledAt: timestamp({ withTimezone: true }),
  ...timestamps,
});

export const twoFactorRecoveryCodes = pgTable(
  'two_factor_recovery_codes',
  {
    id: id(),
    userId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    codeHash: text().notNull(),
    usedAt: timestamp({ withTimezone: true }),
    createdAt: timestamp({ withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index('two_factor_recovery_codes_user_idx').on(table.userId)],
);

export type TwoFactorCredentialRow = typeof twoFactorCredentials.$inferSelect;
export type TwoFactorRecoveryCodeRow = typeof twoFactorRecoveryCodes.$inferSelect;
