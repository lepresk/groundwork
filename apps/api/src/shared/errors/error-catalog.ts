/**
 * HTTP status and default English message for every error code.
 *
 * Typed as `Record<ErrorCode, ...>` so adding a code to the shared
 * registry without describing it here is a compile error.
 */
import { HttpStatus } from '@nestjs/common';
import type { ErrorCode } from '@groundwork/shared';

interface ErrorDescriptor {
  readonly status: HttpStatus;
  readonly message: string;
}

export const ERROR_CATALOG: Record<ErrorCode, ErrorDescriptor> = {
  'generic.bad_request': { status: HttpStatus.BAD_REQUEST, message: 'The request is invalid.' },
  'generic.validation_failed': {
    status: HttpStatus.BAD_REQUEST,
    message: 'The submitted data did not pass validation.',
  },
  'generic.unauthorized': { status: HttpStatus.UNAUTHORIZED, message: 'Authentication required.' },
  'generic.forbidden': { status: HttpStatus.FORBIDDEN, message: 'You cannot perform this action.' },
  'generic.not_found': { status: HttpStatus.NOT_FOUND, message: 'The resource was not found.' },
  'generic.conflict': {
    status: HttpStatus.CONFLICT,
    message: 'The request conflicts with the current state.',
  },
  'generic.rate_limited': {
    status: HttpStatus.TOO_MANY_REQUESTS,
    message: 'Too many requests. Please retry later.',
  },
  'generic.internal': {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'An unexpected error occurred. Please retry later.',
  },
  'generic.upstream_unavailable': {
    status: HttpStatus.SERVICE_UNAVAILABLE,
    message: 'A dependency is unavailable. Please retry later.',
  },
  'auth.invalid_credentials': {
    status: HttpStatus.UNAUTHORIZED,
    message: 'The email or password is incorrect.',
  },
  'auth.email_already_registered': {
    status: HttpStatus.CONFLICT,
    message: 'An account already exists for this email.',
  },
  'auth.email_not_verified': {
    status: HttpStatus.FORBIDDEN,
    message: 'Verify your email address before signing in.',
  },
  'auth.session_invalid': {
    status: HttpStatus.UNAUTHORIZED,
    message: 'Your session is invalid or has expired.',
  },
  'auth.verification_token_invalid': {
    status: HttpStatus.BAD_REQUEST,
    message: 'This verification link is invalid or has expired.',
  },
  'auth.password_reset_token_invalid': {
    status: HttpStatus.BAD_REQUEST,
    message: 'This password reset link is invalid or has expired.',
  },
  'auth.two_factor_challenge_missing': {
    status: HttpStatus.UNAUTHORIZED,
    message: 'No pending two-factor challenge. Sign in again.',
  },
  'auth.two_factor_code_invalid': {
    status: HttpStatus.UNAUTHORIZED,
    message: 'The authentication code is incorrect.',
  },
  'auth.two_factor_already_enabled': {
    status: HttpStatus.CONFLICT,
    message: 'Two-factor authentication is already enabled.',
  },
  'auth.two_factor_not_enabled': {
    status: HttpStatus.CONFLICT,
    message: 'Two-factor authentication is not enabled.',
  },
  'auth.two_factor_setup_missing': {
    status: HttpStatus.CONFLICT,
    message: 'Start two-factor setup before confirming it.',
  },
  // gen:error-catalog
};
