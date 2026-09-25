/**
 * User-facing copy for every API error code. Typed as a full record so a
 * new code in `@groundwork/shared` cannot ship without a message.
 */
import type { ErrorCode } from '@groundwork/shared';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  'generic.bad_request': 'The request could not be processed. Check the form and try again.',
  'generic.validation_failed': 'Some fields are invalid. Fix them and try again.',
  'generic.unauthorized': 'Your session has ended. Sign in again to continue.',
  'generic.forbidden': 'You do not have access to this action.',
  'generic.not_found': 'This item no longer exists.',
  'generic.conflict': 'This action conflicts with a recent change. Refresh and try again.',
  'generic.rate_limited': 'Too many attempts. Wait a few minutes before trying again.',
  'generic.internal': 'Something went wrong on our side. Try again in a moment.',
  'generic.upstream_unavailable': 'The service is temporarily unavailable. Try again in a moment.',
  'auth.invalid_credentials': 'The email or password is incorrect.',
  'auth.email_already_registered': 'An account already exists for this email. Sign in instead.',
  'auth.email_not_verified': 'Confirm your email address first. Check your inbox for the link.',
  'auth.session_invalid': 'Your session has ended. Sign in again to continue.',
  'auth.verification_token_invalid': 'This confirmation link is invalid or has expired.',
  'auth.password_reset_token_invalid':
    'This reset link is invalid or has expired. Request a new one.',
  'auth.two_factor_challenge_missing': 'Your sign-in attempt expired. Enter your password again.',
  'auth.two_factor_code_invalid':
    'This code is incorrect. Check your authenticator app and try again.',
  'auth.two_factor_already_enabled': 'Two-factor authentication is already on.',
  'auth.two_factor_not_enabled': 'Two-factor authentication is already off.',
  'auth.two_factor_setup_missing': 'Start the setup again to get a new QR code.',
  // gen:error-messages
};

export function errorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code];
}
