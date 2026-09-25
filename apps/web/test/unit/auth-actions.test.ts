/**
 * Auth Server Actions: input re-validation, redirects (safe destinations
 * only), cookie relay, and user-facing failures.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

const callApi = vi.fn();
const clearSessionCookie = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock('@/lib/api/call', () => ({ callApi }));
vi.mock('@lepresk/next-bff-fetch', () => ({ clearSessionCookie }));
vi.mock('next/navigation', () => ({ redirect }));

const actions = await import('@/features/auth/actions');
const { verifyEmailToken } = await import('@/features/auth/verify-email');

const failure = { ok: false, status: 401, code: 'auth.invalid_credentials', fieldErrors: {} };
const PROFILE = { id: 'u', email: 'a@b.co' };

describe('auth server actions', () => {
  beforeEach(() => {
    callApi.mockReset();
    redirect.mockClear();
  });

  it('re-validates input and never calls the API with invalid data', async () => {
    const result = await actions.loginAction({ email: 'not-an-email', password: '' });

    expect(result).toMatchObject({ ok: false, fieldErrors: { email: expect.any(String) } });
    expect(callApi).not.toHaveBeenCalled();
  });

  it('redirects to the safe destination after login', async () => {
    callApi.mockResolvedValue({ ok: true, data: { status: 'authenticated', user: PROFILE } });

    await expect(
      actions.loginAction({ email: 'a@b.co', password: 'x' }, 'https://evil.test'),
    ).rejects.toThrow('REDIRECT:/dashboard');
    expect(callApi).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ relaySessionCookie: true }),
    );
  });

  it('sends two-factor accounts to the challenge page, keeping the destination', async () => {
    callApi.mockResolvedValue({ ok: true, data: { status: 'two_factor_required' } });

    await expect(
      actions.loginAction({ email: 'a@b.co', password: 'x' }, '/settings/security'),
    ).rejects.toThrow('REDIRECT:/login/two-factor?next=%2Fsettings%2Fsecurity');
  });

  it('returns user copy when the API refuses', async () => {
    callApi.mockResolvedValue(failure);

    expect(await actions.loginAction({ email: 'a@b.co', password: 'x' })).toMatchObject({
      ok: false,
      message: 'The email or password is incorrect.',
    });
  });

  it('completes the two-factor step', async () => {
    callApi.mockResolvedValueOnce(failure);
    expect(await actions.completeTwoFactorLoginAction({ code: '123456' })).toMatchObject({
      ok: false,
    });
    expect(await actions.completeTwoFactorLoginAction({})).toMatchObject({ ok: false });

    callApi.mockResolvedValueOnce({ ok: true, data: { status: 'authenticated', user: PROFILE } });
    await expect(
      actions.completeTwoFactorLoginAction({ code: '123456' }, '/dashboard'),
    ).rejects.toThrow('REDIRECT:/dashboard');
  });

  it('signs up, then redirects to the check-email page', async () => {
    const input = { email: 'a@b.co', password: 'x'.repeat(12), firstName: 'A', lastName: 'B' };
    expect(await actions.signupAction({ ...input, password: 'short' })).toMatchObject({
      ok: false,
    });

    callApi.mockResolvedValueOnce({ ...failure, code: 'auth.email_already_registered' });
    expect(await actions.signupAction(input)).toMatchObject({ ok: false });

    callApi.mockResolvedValueOnce({ ok: true, data: { status: 'verification_required' } });
    await expect(actions.signupAction(input)).rejects.toThrow('REDIRECT:/signup/check-email');
  });

  it('logs out on both sides', async () => {
    callApi.mockResolvedValue({ ok: true, data: null });

    await expect(actions.logoutAction()).rejects.toThrow('REDIRECT:/login');
    expect(clearSessionCookie).toHaveBeenCalled();
  });

  it.each([
    ['forgotPasswordAction', { email: 'a@b.co' }],
    ['resendVerificationAction', { email: 'a@b.co' }],
  ] as const)('%s succeeds, fails, and validates', async (name, input) => {
    const action = actions[name];
    expect(await action({ email: 'nope' })).toMatchObject({ ok: false });

    callApi.mockResolvedValueOnce({ ok: true, data: null });
    expect(await action(input)).toEqual({ ok: true, data: null });

    callApi.mockResolvedValueOnce({ ...failure, code: 'generic.rate_limited' });
    expect(await action(input)).toMatchObject({
      ok: false,
      message: expect.stringMatching(/Too many/),
    });
  });

  it('resets the password, then redirects to login', async () => {
    const input = { token: 't'.repeat(20), password: 'x'.repeat(12) };
    expect(await actions.resetPasswordAction({ token: 'short' })).toMatchObject({ ok: false });

    callApi.mockResolvedValueOnce({ ...failure, code: 'auth.password_reset_token_invalid' });
    expect(await actions.resetPasswordAction(input)).toMatchObject({ ok: false });

    callApi.mockResolvedValueOnce({ ok: true, data: null });
    await expect(actions.resetPasswordAction(input)).rejects.toThrow('REDIRECT:/login?reset=1');
  });

  it('verifies an email token server-side', async () => {
    callApi.mockResolvedValueOnce({ ok: true, data: null });
    expect(await verifyEmailToken('token')).toEqual({ ok: true, data: null });

    callApi.mockResolvedValueOnce({ ...failure, code: 'auth.verification_token_invalid' });
    expect(await verifyEmailToken('token')).toMatchObject({ ok: false });
  });
});
