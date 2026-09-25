/**
 * Password reset: request without enumeration, single-use tokens, link
 * invalidation, and revocation of every session on success.
 */
import { authSessions, authTokens, users } from '@groundwork/db';
import { ErrorResponseSchema } from '@groundwork/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser, DEFAULT_PASSWORD } from '../helpers/fixtures.js';
import { createTestApp, tokenFromLink, type TestApp } from '../helpers/test-app.js';

const NEW_PASSWORD = 'a-brand-new-long-password';

describe('password reset', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
  });

  afterAll(async () => {
    await t.close();
  });

  async function requestResetToken(): Promise<string> {
    await t.http().post('/api/v1/auth/password/forgot').send({ email: 'ada@example.com' });
    const [email] = t.emails();
    if (email?.template !== 'reset_password') {
      throw new Error('reset email not enqueued');
    }
    return tokenFromLink(email.data.resetUrl);
  }

  it('emails a reset link to a registered account', async () => {
    await createUser(t.db);

    const response = await t
      .http()
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'ada@example.com' });

    expect(response.status).toBe(202);
    expect(t.emails()).toEqual([
      expect.objectContaining({ template: 'reset_password', to: 'ada@example.com' }),
    ]);
    expect(
      await t.db.select().from(authTokens).where(eq(authTokens.purpose, 'password_reset')),
    ).toHaveLength(1);
  });

  it('answers 202 without sending anything for an unknown email', async () => {
    const response = await t
      .http()
      .post('/api/v1/auth/password/forgot')
      .send({ email: 'nobody@example.com' });

    expect(response.status).toBe(202);
    expect(t.emails()).toHaveLength(0);
  });

  it('sets the new password, consumes the token, and revokes every session', async () => {
    const user = await createUser(t.db, { emailVerifiedAt: null });
    await t.db
      .insert(authSessions)
      .values({ userId: user.id, expiresAt: new Date(Date.now() + 60_000) });
    const token = await requestResetToken();

    const response = await t
      .http()
      .post('/api/v1/auth/password/reset')
      .send({ token, password: NEW_PASSWORD });

    expect(response.status).toBe(204);
    const [updated] = await t.db.select().from(users);
    expect(updated?.passwordHash).not.toBe(user.passwordHash);
    expect(updated?.emailVerifiedAt).toBeInstanceOf(Date);
    const [session] = await t.db.select().from(authSessions);
    expect(session?.revokedAt).toBeInstanceOf(Date);

    const oldLogin = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
    const newLogin = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: NEW_PASSWORD });
    expect(oldLogin.status).toBe(401);
    expect(newLogin.status).toBe(200);
  });

  it('rejects a reused token', async () => {
    await createUser(t.db);
    const token = await requestResetToken();
    await t.http().post('/api/v1/auth/password/reset').send({ token, password: NEW_PASSWORD });

    const response = await t
      .http()
      .post('/api/v1/auth/password/reset')
      .send({ token, password: 'yet-another-password' });

    expect(response.status).toBe(400);
    expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.password_reset_token_invalid');
  });

  it('invalidates an older link when a new one is requested', async () => {
    await createUser(t.db);
    const firstToken = await requestResetToken();
    await t.http().post('/api/v1/auth/password/forgot').send({ email: 'ada@example.com' });

    const response = await t
      .http()
      .post('/api/v1/auth/password/reset')
      .send({ token: firstToken, password: NEW_PASSWORD });

    expect(response.status).toBe(400);
  });
});
