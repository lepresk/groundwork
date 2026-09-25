import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const authActions = vi.hoisted(() => ({
  loginAction: vi.fn(),
  signupAction: vi.fn(),
  completeTwoFactorLoginAction: vi.fn(),
  forgotPasswordAction: vi.fn(),
  resetPasswordAction: vi.fn(),
  resendVerificationAction: vi.fn(),
  logoutAction: vi.fn(),
}));
vi.mock('@/features/auth/actions', () => authActions);

const { LoginForm } = await import('@/features/auth/components/login-form');
const { SignupForm } = await import('@/features/auth/components/signup-form');
const { TwoFactorLoginForm } = await import('@/features/auth/components/two-factor-login-form');
const { ForgotPasswordForm } = await import('@/features/auth/components/forgot-password-form');
const { ResetPasswordForm } = await import('@/features/auth/components/reset-password-form');
const { ResendVerificationForm } =
  await import('@/features/auth/components/resend-verification-form');
const { LogoutButton } = await import('@/features/auth/components/logout-button');

const OK = { ok: true, data: null };

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('validates on the client before calling the server', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findAllByRole('alert')).not.toHaveLength(0);
    expect(authActions.loginAction).not.toHaveBeenCalled();
  });

  it('submits normalized values with the destination and shows server errors', async () => {
    authActions.loginAction.mockResolvedValue({
      ok: false,
      message: 'The email or password is incorrect.',
      fieldErrors: { password: 'Wrong password' },
    });
    const user = userEvent.setup();
    render(<LoginForm next="/settings/security" />);

    await user.type(screen.getByLabelText('Email'), 'Ada@Example.com');
    await user.type(screen.getByLabelText('Password'), 'secret');
    await user.click(screen.getByLabelText('Keep me signed in'));
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('The email or password is incorrect.')).toBeInTheDocument();
    expect(screen.getByText('Wrong password')).toBeInTheDocument();
    expect(authActions.loginAction).toHaveBeenCalledWith(
      { email: 'ada@example.com', password: 'secret', rememberMe: true },
      '/settings/security',
    );
  });
});

describe('SignupForm', () => {
  it('submits the profile', async () => {
    authActions.signupAction.mockResolvedValue(OK);
    const user = userEvent.setup();
    render(<SignupForm />);

    await user.type(screen.getByLabelText('First name'), 'Ada');
    await user.type(screen.getByLabelText('Last name'), 'Lovelace');
    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.type(screen.getByLabelText('Password'), 'a-long-enough-password');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(authActions.signupAction).toHaveBeenCalledWith({
        firstName: 'Ada',
        lastName: 'Lovelace',
        email: 'ada@example.com',
        password: 'a-long-enough-password',
      });
    });
  });
});

describe('TwoFactorLoginForm', () => {
  it('switches between the authenticator code and a recovery code', async () => {
    authActions.completeTwoFactorLoginAction.mockResolvedValue(OK);
    const user = userEvent.setup();
    render(<TwoFactorLoginForm next="/dashboard" />);

    await user.click(screen.getByRole('button', { name: 'Use a recovery code instead' }));
    await user.type(screen.getByLabelText('Recovery code'), 'abcde-12345');
    await user.click(screen.getByRole('button', { name: 'Verify' }));

    await waitFor(() => {
      expect(authActions.completeTwoFactorLoginAction).toHaveBeenCalledWith(
        { recoveryCode: 'abcde-12345' },
        '/dashboard',
      );
    });
    await user.click(screen.getByRole('button', { name: 'Use the authenticator app instead' }));
    expect(screen.getByLabelText('Authentication code')).toBeInTheDocument();
  });
});

describe('email-based forms', () => {
  it('confirms a password reset request without revealing account existence', async () => {
    authActions.forgotPasswordAction.mockResolvedValue(OK);
    const user = userEvent.setup();
    render(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset link' }));

    expect(await screen.findByText(/If an account exists/)).toBeInTheDocument();
  });

  it('confirms a new verification link', async () => {
    authActions.resendVerificationAction.mockResolvedValue(OK);
    const user = userEvent.setup();
    render(<ResendVerificationForm />);

    await user.type(screen.getByLabelText('Email'), 'ada@example.com');
    await user.click(screen.getByRole('button', { name: 'Send a new link' }));

    expect(await screen.findByText(/a new link is on its way/)).toBeInTheDocument();
  });

  it('submits the reset token with the new password', async () => {
    authActions.resetPasswordAction.mockResolvedValue(OK);
    const user = userEvent.setup();
    render(<ResetPasswordForm token={'t'.repeat(32)} />);

    await user.type(screen.getByLabelText('New password'), 'a-brand-new-password');
    await user.click(screen.getByRole('button', { name: 'Set new password' }));

    await waitFor(() => {
      expect(authActions.resetPasswordAction).toHaveBeenCalledWith({
        token: 't'.repeat(32),
        password: 'a-brand-new-password',
      });
    });
  });
});

describe('LogoutButton', () => {
  it('calls the logout action', async () => {
    authActions.logoutAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<LogoutButton />);

    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(authActions.logoutAction).toHaveBeenCalled();
  });
});
