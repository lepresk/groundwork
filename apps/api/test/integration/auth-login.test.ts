/**
 * Login, session cookie, `/me`, and logout: cookie flags, remember-me
 * lifetimes, client metadata, credential failures, revocation, and expiry.
 */
import { authSessions } from '@groundwork/db';
import {
  ErrorResponseSchema,
  LoginResponseSchema,
  SESSION_COOKIE_NAME,
  UserProfileSchema,
} from '@groundwork/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser, DEFAULT_PASSWORD, expireAllSessions } from '../helpers/fixtures.js';
import { createTestApp, type TestApp } from '../helpers/test-app.js';

function sessionCookie(setCookie: string[] | string | undefined): string {
  const cookies = Array.isArray(setCookie) ? setCookie : [setCookie ?? ''];
  const cookie = cookies.find((value) => value.startsWith(`${SESSION_COOKIE_NAME}=`));
  if (cookie === undefined) {
    throw new Error('No session cookie in response');
  }
  return cookie;
}

describe('login, session, and logout', () => {
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

  it('signs in a verified user, records the client, and issues an HttpOnly browser-session cookie', async () => {
    const user = await createUser(t.db);

    const response = await t
      .http()
      .post('/api/v1/auth/login')
      .set('x-client-ip', '203.0.113.7')
      .set('x-client-user-agent', 'Vitest Browser')
      .send({ email: 'ADA@example.com', password: DEFAULT_PASSWORD });

    expect(response.status).toBe(200);
    const body = LoginResponseSchema.parse(response.body);
    expect(body).toEqual({
      status: 'authenticated',
      user: expect.objectContaining({ id: user.id }),
    });

    const cookie = sessionCookie(response.headers['set-cookie']);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).not.toMatch(/Max-Age/i);

    const [session] = await t.db.select().from(authSessions);
    expect(session).toMatchObject({
      userId: user.id,
      ipAddress: '203.0.113.7',
      userAgent: 'Vitest Browser',
      revokedAt: null,
    });
  });

  it('issues a persistent cookie and a 30-day session when rememberMe is set', async () => {
    await createUser(t.db);

    const response = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD, rememberMe: true });

    expect(sessionCookie(response.headers['set-cookie'])).toMatch(/Max-Age=\d+/i);
    const [session] = await t.db.select().from(authSessions);
    const lifetimeDays = ((session?.expiresAt.getTime() ?? 0) - Date.now()) / 86_400_000;
    expect(lifetimeDays).toBeGreaterThan(29);
  });

  it('exposes the profile on /me for an authenticated session', async () => {
    await createUser(t.db);
    const agent = t.agent();
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });

    const response = await agent.get('/api/v1/auth/me');

    expect(response.status).toBe(200);
    expect(UserProfileSchema.parse(response.body)).toMatchObject({
      email: 'ada@example.com',
      twoFactorEnabled: false,
    });
  });

  it.each([
    ['a wrong password', 'ada@example.com', 'not-the-password'],
    ['an unknown email', 'nobody@example.com', DEFAULT_PASSWORD],
  ])('rejects %s with the same error and creates no session', async (_case, email, password) => {
    await createUser(t.db);

    const response = await t.http().post('/api/v1/auth/login').send({ email, password });

    expect(response.status).toBe(401);
    expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.invalid_credentials');
    expect(await t.db.select().from(authSessions)).toHaveLength(0);
  });

  it('refuses an account whose email is not verified', async () => {
    await createUser(t.db, { emailVerifiedAt: null });

    const response = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });

    expect(response.status).toBe(403);
    expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.email_not_verified');
    expect(await t.db.select().from(authSessions)).toHaveLength(0);
  });

  it('revokes the session on logout so the cookie stops working', async () => {
    await createUser(t.db);
    const agent = t.agent();
    const login = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
    const stolenCookie = sessionCookie(login.headers['set-cookie']).split(';')[0] ?? '';

    const logout = await agent.post('/api/v1/auth/logout');

    expect(logout.status).toBe(204);
    const [session] = await t.db.select().from(authSessions);
    expect(session?.revokedAt).toBeInstanceOf(Date);
    const replay = await t.http().get('/api/v1/auth/me').set('Cookie', stolenCookie);
    expect(replay.status).toBe(401);
  });

  it('rejects an expired session', async () => {
    await createUser(t.db);
    const agent = t.agent();
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
    await expireAllSessions(t.db);

    const response = await agent.get('/api/v1/auth/me');

    expect(response.status).toBe(401);
    expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.session_invalid');
  });

  it('rejects a tampered cookie', async () => {
    const response = await t
      .http()
      .get('/api/v1/auth/me')
      .set('Cookie', `${SESSION_COOKIE_NAME}=Fe26.2**forged**cookie`);

    expect(response.status).toBe(401);
  });
});

describe('login with a pending (unconfirmed) two-factor setup', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
    await t.reset();
  });

  afterAll(async () => {
    await t.close();
  });

  it('signs in directly because two-factor is not active yet', async () => {
    await createUser(t.db);
    const agent = t.agent();
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
    await agent.post('/api/v1/auth/two-factor/setup');
    await agent.post('/api/v1/auth/logout');

    const response = await t
      .http()
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });

    expect(LoginResponseSchema.parse(response.body).status).toBe('authenticated');
  });
});
