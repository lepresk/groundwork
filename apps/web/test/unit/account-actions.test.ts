import { beforeEach, describe, expect, it, vi } from 'vitest';

const callApi = vi.fn();
const revalidatePath = vi.fn();
vi.mock('@/lib/api/call', () => ({ callApi }));
vi.mock('next/cache', () => ({ revalidatePath }));

const actions = await import('@/features/account/actions');
const failure = {
  ok: false,
  status: 409,
  code: 'auth.two_factor_already_enabled',
  fieldErrors: {},
};

describe('account server actions', () => {
  beforeEach(() => {
    callApi.mockReset();
    revalidatePath.mockReset();
  });

  it('renders the otpauth URL as a QR code', async () => {
    callApi.mockResolvedValueOnce({
      ok: true,
      data: { secret: 'SECRET', otpauthUrl: 'otpauth://totp/Groundwork:a@b.co?secret=SECRET' },
    });

    const result = await actions.startTwoFactorSetupAction();

    expect(result).toMatchObject({
      ok: true,
      data: { secret: 'SECRET', qrCodeDataUrl: expect.stringMatching(/^data:image\/png/) },
    });
  });

  it('reports a setup failure', async () => {
    callApi.mockResolvedValueOnce(failure);

    expect(await actions.startTwoFactorSetupAction()).toMatchObject({ ok: false });
  });

  it('enables two-factor and refreshes the settings page', async () => {
    expect(await actions.enableTwoFactorAction({ code: 'abc' })).toMatchObject({ ok: false });

    callApi.mockResolvedValueOnce(failure);
    expect(await actions.enableTwoFactorAction({ code: '123456' })).toMatchObject({ ok: false });

    callApi.mockResolvedValueOnce({ ok: true, data: { recoveryCodes: ['a'] } });
    expect(await actions.enableTwoFactorAction({ code: '123456' })).toEqual({
      ok: true,
      data: { recoveryCodes: ['a'] },
    });
    expect(revalidatePath).toHaveBeenCalledWith('/settings/security');
  });

  it('disables two-factor and refreshes the settings page', async () => {
    expect(await actions.disableTwoFactorAction({ password: '' })).toMatchObject({ ok: false });

    callApi.mockResolvedValueOnce({ ...failure, code: 'auth.invalid_credentials' });
    expect(await actions.disableTwoFactorAction({ password: 'p', code: '123456' })).toMatchObject({
      ok: false,
    });

    callApi.mockResolvedValueOnce({ ok: true, data: null });
    expect(await actions.disableTwoFactorAction({ password: 'p', code: '123456' })).toEqual({
      ok: true,
      data: null,
    });
    expect(revalidatePath).toHaveBeenCalledTimes(1);
  });
});
