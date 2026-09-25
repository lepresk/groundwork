/**
 * Defensive branches of auth actions that cannot be reached through HTTP
 * (the session guard rejects a deleted user first), exercised with mocks.
 */
import { describe, expect, it, vi } from 'vitest';
import { GetCurrentUserAction } from '../../src/modules/auth/actions/get-current-user.action.js';
import { SignupAction } from '../../src/modules/auth/actions/signup.action.js';
import { StartTwoFactorSetupAction } from '../../src/modules/auth/actions/start-two-factor-setup.action.js';
import { EnableTwoFactorAction } from '../../src/modules/auth/actions/enable-two-factor.action.js';
import { DisableTwoFactorAction } from '../../src/modules/auth/actions/disable-two-factor.action.js';
import { toUserProfile } from '../../src/modules/auth/auth.mappers.js';
import type { DbService } from '../../src/shared/db/db.service.js';

const db = {
  client: {},
  transaction: (callback: (tx: unknown) => Promise<unknown>) => callback({}),
} as unknown as DbService;

const missingUser = { findById: vi.fn().mockResolvedValue(null) };
const noCredential = { findCredential: vi.fn().mockResolvedValue(null) };

describe('auth actions for a user deleted mid-session', () => {
  it('GetCurrentUserAction reports an invalid session', async () => {
    const action = new GetCurrentUserAction(db, missingUser as never, noCredential as never);

    expect(await action.execute('id')).toEqual({ ok: false, error: 'auth.session_invalid' });
  });

  it('StartTwoFactorSetupAction reports an invalid session', async () => {
    const action = new StartTwoFactorSetupAction(
      db,
      missingUser as never,
      noCredential as never,
      {} as never,
    );

    expect(await action.execute('id')).toEqual({ ok: false, error: 'auth.session_invalid' });
  });

  it('EnableTwoFactorAction reports an invalid session', async () => {
    const action = new EnableTwoFactorAction(
      db,
      missingUser as never,
      noCredential as never,
      {} as never,
      {} as never,
    );

    expect(await action.execute('id', '123456')).toEqual({
      ok: false,
      error: 'auth.session_invalid',
    });
  });

  it('DisableTwoFactorAction reports an invalid session', async () => {
    const action = new DisableTwoFactorAction(
      db,
      missingUser as never,
      noCredential as never,
      {} as never,
      {} as never,
      {} as never,
    );

    expect(await action.execute('id', { password: 'x', code: '123456' })).toEqual({
      ok: false,
      error: 'auth.session_invalid',
    });
  });
});

describe('SignupAction', () => {
  it('rethrows database errors that are not a duplicate email', async () => {
    const failure = new Error('connection lost');
    const action = new SignupAction(
      db,
      { create: vi.fn().mockRejectedValue(failure) } as never,
      {} as never,
      { hash: vi.fn().mockResolvedValue('hash') } as never,
      {} as never,
    );

    await expect(
      action.execute({ email: 'a@b.co', password: 'x'.repeat(12), firstName: 'A', lastName: 'B' }),
    ).rejects.toBe(failure);
  });
});

describe('toUserProfile', () => {
  it('refuses to expose an unverified user', () => {
    expect(() =>
      toUserProfile(
        {
          id: 'id',
          email: 'a@b.co',
          passwordHash: 'h',
          firstName: 'A',
          lastName: 'B',
          emailVerifiedAt: null,
          passwordChangedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        false,
      ),
    ).toThrow(/verified/);
  });
});
