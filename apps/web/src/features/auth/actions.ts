'use server';
/**
 * Server Actions for authentication. They are the only door between the
 * browser and the API: input is re-validated with the shared schemas (the
 * client is never trusted), then forwarded through the BFF client, and the
 * API's session cookie is relayed to the browser.
 */
import {
  EmailRequestSchema,
  LoginRequestSchema,
  LoginResponseSchema,
  ResetPasswordRequestSchema,
  SignupRequestSchema,
  SignupResponseSchema,
  AuthenticatedResponseSchema,
  TwoFactorLoginRequestSchema,
} from '@groundwork/shared';
import { clearSessionCookie } from '@lepresk/next-bff-fetch';
import { SESSION_COOKIE_NAME } from '@groundwork/shared';
import { redirect } from 'next/navigation';
import { actionFailure, invalidInput, type ActionResult } from '@/lib/action-result';
import { callApi } from '@/lib/api/call';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { fieldErrorsFromZod } from '@/lib/validation';

export async function signupAction(input: unknown): Promise<ActionResult> {
  const parsed = SignupRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(fieldErrorsFromZod(parsed.error));
  }
  const result = await callApi('/auth/signup', {
    method: 'POST',
    body: parsed.data,
    schema: SignupResponseSchema,
  });
  if (!result.ok) {
    return actionFailure(result);
  }
  redirect('/signup/check-email');
}

export async function loginAction(input: unknown, next?: string): Promise<ActionResult> {
  const parsed = LoginRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(fieldErrorsFromZod(parsed.error));
  }
  const result = await callApi('/auth/login', {
    method: 'POST',
    body: parsed.data,
    schema: LoginResponseSchema,
    relaySessionCookie: true,
  });
  if (!result.ok) {
    return actionFailure(result);
  }
  if (result.data.status === 'two_factor_required') {
    redirect(`/login/two-factor?next=${encodeURIComponent(safeRedirectPath(next))}`);
  }
  redirect(safeRedirectPath(next) as '/dashboard');
}

export async function completeTwoFactorLoginAction(
  input: unknown,
  next?: string,
): Promise<ActionResult> {
  const parsed = TwoFactorLoginRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(fieldErrorsFromZod(parsed.error));
  }
  const result = await callApi('/auth/login/two-factor', {
    method: 'POST',
    body: parsed.data,
    schema: AuthenticatedResponseSchema,
    relaySessionCookie: true,
  });
  if (!result.ok) {
    return actionFailure(result);
  }
  redirect(safeRedirectPath(next) as '/dashboard');
}

export async function logoutAction(): Promise<void> {
  await callApi('/auth/logout', { method: 'POST' });
  await clearSessionCookie(SESSION_COOKIE_NAME);
  redirect('/login');
}

export async function forgotPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = EmailRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(fieldErrorsFromZod(parsed.error));
  }
  const result = await callApi('/auth/password/forgot', { method: 'POST', body: parsed.data });
  return result.ok ? { ok: true, data: null } : actionFailure(result);
}

export async function resetPasswordAction(input: unknown): Promise<ActionResult> {
  const parsed = ResetPasswordRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(fieldErrorsFromZod(parsed.error));
  }
  const result = await callApi('/auth/password/reset', { method: 'POST', body: parsed.data });
  if (!result.ok) {
    return actionFailure(result);
  }
  redirect('/login?reset=1');
}

export async function resendVerificationAction(input: unknown): Promise<ActionResult> {
  const parsed = EmailRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(fieldErrorsFromZod(parsed.error));
  }
  const result = await callApi('/auth/email/resend', { method: 'POST', body: parsed.data });
  return result.ok ? { ok: true, data: null } : actionFailure(result);
}
