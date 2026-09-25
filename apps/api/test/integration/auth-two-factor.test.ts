import { twoFactorCredentials, twoFactorRecoveryCodes } from '@groundwork/db';
import {
  AuthenticatedResponseSchema,
  ErrorResponseSchema,
  LoginResponseSchema,
  TwoFactorEnableResponseSchema,
  TwoFactorSetupResponseSchema,
} from '@groundwork/shared';
import { isNotNull } from 'drizzle-orm';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser, DEFAULT_PASSWORD, enableTwoFactor, totpCode } from '../helpers/fixtures.js';
import { createTestApp, type TestApp } from '../helpers/test-app.js';

type Agent = ReturnType<TestApp['agent']>;

describe('two-factor authentication', () => {
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

  async function signedInAgent(): Promise<Agent> {
    const agent = t.agent();
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
    return agent;
  }

  describe('setup and enable', () => {
    it('enables TOTP after a valid code and returns single-use recovery codes', async () => {
      await createUser(t.db);
      const agent = await signedInAgent();

      const setup = await agent.post('/api/v1/auth/two-factor/setup');
      const { secret, otpauthUrl } = TwoFactorSetupResponseSchema.parse(setup.body);
      const enable = await agent
        .post('/api/v1/auth/two-factor/enable')
        .send({ code: await totpCode(secret) });

      expect(setup.status).toBe(200);
      expect(otpauthUrl).toMatch(/^otpauth:\/\/totp\//);
      expect(enable.status).toBe(200);
      const { recoveryCodes } = TwoFactorEnableResponseSchema.parse(enable.body);
      expect(new Set(recoveryCodes).size).toBe(10);

      const [credential] = await t.db.select().from(twoFactorCredentials);
      expect(credential?.enabledAt).toBeInstanceOf(Date);
      expect(credential?.encryptedSecret).not.toContain(secret);
      const storedCodes = await t.db.select().from(twoFactorRecoveryCodes);
      expect(storedCodes.map((row) => row.codeHash)).not.toContain(recoveryCodes[0]);
      expect(t.emails()).toEqual([
        expect.objectContaining({
          template: 'two_factor_changed',
          data: { firstName: 'Ada', enabled: true },
        }),
      ]);
    });

    it('keeps two-factor disabled when the confirmation code is wrong', async () => {
      await createUser(t.db);
      const agent = await signedInAgent();
      await agent.post('/api/v1/auth/two-factor/setup');

      const response = await agent.post('/api/v1/auth/two-factor/enable').send({ code: '000000' });

      expect(response.status).toBe(401);
      expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.two_factor_code_invalid');
      expect(
        await t.db
          .select()
          .from(twoFactorCredentials)
          .where(isNotNull(twoFactorCredentials.enabledAt)),
      ).toHaveLength(0);
    });

    it('refuses to enable without a pending setup', async () => {
      await createUser(t.db);
      const agent = await signedInAgent();

      const response = await agent.post('/api/v1/auth/two-factor/enable').send({ code: '123456' });

      expect(response.status).toBe(409);
      expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.two_factor_setup_missing');
    });

    it('refuses a new setup or enable while two-factor is active', async () => {
      const user = await createUser(t.db);
      const agent = await signedInAgent();
      await enableTwoFactor(t.db, user.id);

      const setup = await agent.post('/api/v1/auth/two-factor/setup');
      const enable = await agent.post('/api/v1/auth/two-factor/enable').send({ code: '123456' });

      expect(setup.status).toBe(409);
      expect(enable.status).toBe(409);
      expect(ErrorResponseSchema.parse(enable.body).code).toBe('auth.two_factor_already_enabled');
    });

    it('requires a session', async () => {
      const response = await t.http().post('/api/v1/auth/two-factor/setup');

      expect(response.status).toBe(401);
    });
  });

  describe('login challenge', () => {
    async function startChallenge(): Promise<{ agent: Agent; secret: string }> {
      const user = await createUser(t.db);
      const secret = await enableTwoFactor(t.db, user.id);
      const agent = t.agent();
      const login = await agent
        .post('/api/v1/auth/login')
        .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
      expect(LoginResponseSchema.parse(login.body)).toEqual({ status: 'two_factor_required' });
      return { agent, secret };
    }

    it('does not grant a session before the second factor', async () => {
      const { agent } = await startChallenge();

      const response = await agent.get('/api/v1/auth/me');

      expect(response.status).toBe(401);
    });

    it('completes the login with a valid TOTP code', async () => {
      const { agent, secret } = await startChallenge();

      const response = await agent
        .post('/api/v1/auth/login/two-factor')
        .send({ code: await totpCode(secret) });

      expect(response.status).toBe(200);
      expect(AuthenticatedResponseSchema.parse(response.body).user.twoFactorEnabled).toBe(true);
      expect((await agent.get('/api/v1/auth/me')).status).toBe(200);
    });

    it('rejects a wrong TOTP code', async () => {
      const { agent } = await startChallenge();

      const response = await agent.post('/api/v1/auth/login/two-factor').send({ code: '000000' });

      expect(response.status).toBe(401);
      expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.two_factor_code_invalid');
    });

    it('accepts a recovery code exactly once', async () => {
      const user = await createUser(t.db);
      const agent = await signedInAgent();
      const setup = TwoFactorSetupResponseSchema.parse(
        (await agent.post('/api/v1/auth/two-factor/setup')).body,
      );
      const enable = await agent
        .post('/api/v1/auth/two-factor/enable')
        .send({ code: await totpCode(setup.secret) });
      const [recoveryCode] = TwoFactorEnableResponseSchema.parse(enable.body).recoveryCodes;
      await agent.post('/api/v1/auth/logout');

      const login = async (): Promise<number> => {
        const challengeAgent = t.agent();
        await challengeAgent
          .post('/api/v1/auth/login')
          .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
        const response = await challengeAgent
          .post('/api/v1/auth/login/two-factor')
          .send({ recoveryCode });
        return response.status;
      };

      expect(await login()).toBe(200);
      expect(await login()).toBe(401);
      const used = await t.db
        .select()
        .from(twoFactorRecoveryCodes)
        .where(isNotNull(twoFactorRecoveryCodes.usedAt));
      expect(used).toEqual([expect.objectContaining({ userId: user.id })]);
    });

    it('rejects a second factor without a pending challenge', async () => {
      const response = await t
        .http()
        .post('/api/v1/auth/login/two-factor')
        .send({ code: '123456' });

      expect(response.status).toBe(401);
      expect(ErrorResponseSchema.parse(response.body).code).toBe(
        'auth.two_factor_challenge_missing',
      );
    });
  });

  describe('disable', () => {
    it('removes the credential and recovery codes with password and code', async () => {
      const user = await createUser(t.db);
      const secret = await enableTwoFactor(t.db, user.id);
      const agent = t.agent();
      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
      await agent.post('/api/v1/auth/login/two-factor').send({ code: await totpCode(secret) });

      const response = await agent
        .post('/api/v1/auth/two-factor/disable')
        .send({ password: DEFAULT_PASSWORD, code: await totpCode(secret) });

      expect(response.status).toBe(204);
      expect(await t.db.select().from(twoFactorCredentials)).toHaveLength(0);
      expect(t.emails()).toEqual([
        expect.objectContaining({
          template: 'two_factor_changed',
          data: { firstName: 'Ada', enabled: false },
        }),
      ]);
    });

    it.each([
      ['a wrong password', 'wrong-password', true, 'auth.invalid_credentials'],
      ['a wrong code', DEFAULT_PASSWORD, false, 'auth.two_factor_code_invalid'],
    ])('keeps two-factor enabled on %s', async (_case, password, validCode, expectedCode) => {
      const user = await createUser(t.db);
      const secret = await enableTwoFactor(t.db, user.id);
      const agent = t.agent();
      await agent
        .post('/api/v1/auth/login')
        .send({ email: 'ada@example.com', password: DEFAULT_PASSWORD });
      await agent.post('/api/v1/auth/login/two-factor').send({ code: await totpCode(secret) });

      const response = await agent
        .post('/api/v1/auth/two-factor/disable')
        .send({ password, code: validCode ? await totpCode(secret) : '000000' });

      expect(response.status).toBe(401);
      expect(ErrorResponseSchema.parse(response.body).code).toBe(expectedCode);
      expect(await t.db.select().from(twoFactorCredentials)).toHaveLength(1);
    });

    it('reports when two-factor is not enabled', async () => {
      await createUser(t.db);
      const agent = await signedInAgent();

      const response = await agent
        .post('/api/v1/auth/two-factor/disable')
        .send({ password: DEFAULT_PASSWORD, code: '123456' });

      expect(response.status).toBe(409);
      expect(ErrorResponseSchema.parse(response.body).code).toBe('auth.two_factor_not_enabled');
    });
  });
});
