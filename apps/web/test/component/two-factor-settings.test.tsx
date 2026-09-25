import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const accountActions = vi.hoisted(() => ({
  startTwoFactorSetupAction: vi.fn(),
  enableTwoFactorAction: vi.fn(),
  disableTwoFactorAction: vi.fn(),
}));
vi.mock('@/features/account/actions', () => accountActions);

const { EnableTwoFactor } = await import('@/features/account/components/enable-two-factor');
const { DisableTwoFactor } = await import('@/features/account/components/disable-two-factor');

describe('EnableTwoFactor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('walks through setup, confirmation, and shows recovery codes once', async () => {
    accountActions.startTwoFactorSetupAction.mockResolvedValue({
      ok: true,
      data: { secret: 'SECRETKEY', qrCodeDataUrl: 'data:image/png;base64,AAAA' },
    });
    accountActions.enableTwoFactorAction.mockResolvedValue({
      ok: true,
      data: { recoveryCodes: ['aaaaa-11111', 'bbbbb-22222'] },
    });
    const user = userEvent.setup();
    render(<EnableTwoFactor />);

    await user.click(screen.getByRole('button', { name: 'Set up two-factor authentication' }));
    expect(await screen.findByAltText('QR code for your authenticator app')).toBeInTheDocument();
    expect(screen.getByText('SECRETKEY')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Authentication code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Turn on' }));

    expect(await screen.findByText('aaaaa-11111')).toBeInTheDocument();
    expect(accountActions.enableTwoFactorAction).toHaveBeenCalledWith({ code: '123456' });
  });

  it('shows the setup error', async () => {
    accountActions.startTwoFactorSetupAction.mockResolvedValue({
      ok: false,
      message: 'Two-factor authentication is already on.',
      fieldErrors: {},
    });
    const user = userEvent.setup();
    render(<EnableTwoFactor />);

    await user.click(screen.getByRole('button', { name: 'Set up two-factor authentication' }));

    expect(await screen.findByText('Two-factor authentication is already on.')).toBeInTheDocument();
  });
});

describe('DisableTwoFactor', () => {
  it('requires an explicit confirmation and can be cancelled', async () => {
    const user = userEvent.setup();
    render(<DisableTwoFactor />);

    await user.click(screen.getByRole('button', { name: 'Turn off two-factor authentication' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByRole('button', { name: 'Turn off two-factor authentication' }),
    ).toBeInTheDocument();
    expect(accountActions.disableTwoFactorAction).not.toHaveBeenCalled();
  });

  it('submits the password and code', async () => {
    accountActions.disableTwoFactorAction.mockResolvedValue({ ok: true, data: null });
    const user = userEvent.setup();
    render(<DisableTwoFactor />);

    await user.click(screen.getByRole('button', { name: 'Turn off two-factor authentication' }));
    await user.type(screen.getByLabelText('Password'), 'my-password');
    await user.type(screen.getByLabelText('Authentication code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Turn off' }));

    expect(accountActions.disableTwoFactorAction).toHaveBeenCalledWith({
      password: 'my-password',
      code: '123456',
    });
  });
});
