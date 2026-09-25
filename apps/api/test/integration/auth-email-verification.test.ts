/**
 * Email verification: token consumption, reuse, expiry, and re-sending
 * without revealing whether an account exists.
 */
import { authTokens, users } from '@groundwork/db';
import { ErrorResponseSchema } from '@groundwork/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser } from '../helpers/fixtures.js';
import { createTestApp, tokenFromLink, type TestApp } from '../helpers/test-app.js';

describe('email verification', () => {
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

  async function signupAndGetToken(): Promise<string> {
    await t.http().post('/api/v1/auth/signup').send({
      email: 'grace@example.com',
      password: 'a-long-enough-password',
      firstName: 'Grace',
      lastName: 'Hopper',
    });
    const [email] = t.emails();
    if (email?.template !== 'verify_email') {
      throw new Error('verification email not enqueued');
    }
    return tokenFromLink(email.data.verificationUrl);
  }

  it('verifies the email and consumes the token', async () => {
    const token = await signupAndGetToken();

    const response = await t.http().post('/api/v1/auth/email/verify').send({ token });

    expect(response.status).toBe(204);
    const [user] = await t.db.select().from(users);
    expect(user?.emailVerifiedAt).toBeInstanceOf(Date);
    const [row] = await t.db.select().from(authTokens);
    expect(row?.consumedAt).toBeInstanceOf(Date);
  });

  it('rejects a token that was already used', async () => {
    const token = await signupAndGetToken();
    await t.http().post('/api/v1/auth/email/verify').send({ token });

    const response = await t.http().post('/api/v1/auth/email/verify').send({ token });

    expect(response.status).toBe(400);
    expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.verification_token_invalid');
  });

  it('rejects an expired token and leaves the user unverified', async () => {
    const token = await signupAndGetToken();
    await t.db.update(authTokens).set({ expiresAt: new Date(Date.now() - 1000) });

    const response = await t.http().post('/api/v1/auth/email/verify').send({ token });

    expect(response.status).toBe(400);
    const [user] = await t.db.select().from(users);
    expect(user?.emailVerifiedAt).toBeNull();
  });

  it('re-sends a link for an unverified account and invalidates the previous one', async () => {
    const firstToken = await signupAndGetToken();

    const response = await t
      .http()
      .post('/api/v1/auth/email/resend')
      .send({ email: 'GRACE@example.com' });

    expect(response.status).toBe(202);
    expect(t.emails()).toHaveLength(2);
    const stale = await t.http().post('/api/v1/auth/email/verify').send({ token: firstToken });
    expect(stale.status).toBe(400);
  });

  it('answers 202 without sending anything for unknown or verified emails', async () => {
    await createUser(t.db, { email: 'verified@example.com' });

    const unknown = await t
      .http()
      .post('/api/v1/auth/email/resend')
      .send({ email: 'nobody@example.com' });
    const verified = await t
      .http()
      .post('/api/v1/auth/email/resend')
      .send({ email: 'verified@example.com' });

    expect(unknown.status).toBe(202);
    expect(verified.status).toBe(202);
    expect(t.emails()).toHaveLength(0);
    expect(
      await t.db.select().from(authTokens).where(eq(authTokens.purpose, 'email_verification')),
    ).toHaveLength(0);
  });
});
