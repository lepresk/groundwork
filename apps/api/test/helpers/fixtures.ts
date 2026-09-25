/**
 * Database fixtures. They write rows directly so each test arranges only
 * the state it needs, without going through unrelated endpoints.
 */
import {
  authSessions,
  twoFactorCredentials,
  users,
  type Database,
  type UserRow,
} from '@groundwork/db';
import argon2 from 'argon2';
import { generate, generateSecret } from 'otplib';
import { SecretBox } from '../../src/shared/crypto/secret-box.js';

export const DEFAULT_PASSWORD = 'correct-horse-battery-staple';

export async function createUser(
  db: Database,
  overrides: Partial<Pick<UserRow, 'email' | 'firstName' | 'lastName' | 'emailVerifiedAt'>> & {
    password?: string;
  } = {},
): Promise<UserRow> {
  const { password = DEFAULT_PASSWORD, ...fields } = overrides;
  const [user] = await db
    .insert(users)
    .values({
      email: 'ada@example.com',
      firstName: 'Ada',
      lastName: 'Lovelace',
      emailVerifiedAt: new Date(),
      ...fields,
      passwordHash: await argon2.hash(password),
    })
    .returning();
  if (user === undefined) {
    throw new Error('createUser returned no row');
  }
  return user;
}

/** Enables TOTP for a user and returns the clear secret to compute codes in tests. */
export async function enableTwoFactor(db: Database, userId: string): Promise<string> {
  const secret = generateSecret();
  const box = new SecretBox(process.env['TWO_FACTOR_ENCRYPTION_KEY'] ?? '');
  await db.insert(twoFactorCredentials).values({
    userId,
    encryptedSecret: box.seal(secret),
    enabledAt: new Date(),
  });
  return secret;
}

export function totpCode(secret: string): Promise<string> {
  return generate({ secret });
}

export async function expireAllSessions(db: Database): Promise<void> {
  await db.update(authSessions).set({ expiresAt: new Date(Date.now() - 1000) });
}
