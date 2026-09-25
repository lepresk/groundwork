import { authTokens, users } from '@groundwork/db';
import { ErrorResponseSchema, SignupResponseSchema } from '@groundwork/shared';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser } from '../helpers/fixtures.js';
import { createTestApp, type TestApp } from '../helpers/test-app.js';

const VALID_SIGNUP = {
  email: 'Grace@Example.com',
  password: 'a-long-enough-password',
  firstName: 'Grace',
  lastName: 'Hopper',
};

describe('POST /api/v1/auth/signup', () => {
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

  it('creates an unverified user with a hashed password and emails a verification link', async () => {
    const response = await t.http().post('/api/v1/auth/signup').send(VALID_SIGNUP);

    expect(response.status).toBe(201);
    expect(SignupResponseSchema.parse(response.body)).toEqual({ status: 'verification_required' });

    const [user] = await t.db.select().from(users);
    expect(user?.email).toBe('grace@example.com');
    expect(user?.emailVerifiedAt).toBeNull();
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);

    const tokens = await t.db.select().from(authTokens);
    expect(tokens).toHaveLength(1);
    expect(tokens[0]?.purpose).toBe('email_verification');

    const [email] = t.emails();
    expect(email?.template).toBe('verify_email');
    expect(email?.to).toBe('grace@example.com');
  });

  it('rejects an email that is already registered, regardless of case', async () => {
    await createUser(t.db, { email: 'grace@example.com' });

    const response = await t.http().post('/api/v1/auth/signup').send(VALID_SIGNUP);

    expect(response.status).toBe(409);
    expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.email_already_registered');
    expect(
      await t.db.select().from(users).where(eq(users.email, 'grace@example.com')),
    ).toHaveLength(1);
    expect(t.emails()).toHaveLength(0);
  });

  it('rejects a password below the policy minimum with field-level issues', async () => {
    const response = await t
      .http()
      .post('/api/v1/auth/signup')
      .send({ ...VALID_SIGNUP, password: 'short' });

    expect(response.status).toBe(400);
    const body = ErrorResponseSchema.parse(response.body);
    expect(body.code).toBe('generic.validation_failed');
    expect(body.meta?.['issues']).toEqual([
      expect.objectContaining({ path: 'password', code: 'too_small' }),
    ]);
    expect(await t.db.select().from(users)).toHaveLength(0);
  });

  it('rejects unknown fields instead of silently ignoring them', async () => {
    const response = await t
      .http()
      .post('/api/v1/auth/signup')
      .send({ ...VALID_SIGNUP, isAdmin: true });

    expect(response.status).toBe(400);
    expect(await t.db.select().from(users)).toHaveLength(0);
  });
});
