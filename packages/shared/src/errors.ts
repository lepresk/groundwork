/**
 * Canonical error code registry shared by the API (which emits the codes)
 * and the web app (which maps them to user-facing copy).
 *
 * Codes are stable identifiers: clients pivot on `code`, never on
 * `message`. Add new codes here, grouped by domain, in `domain.reason`
 * snake_case form.
 */
import { z } from 'zod';

export const ERROR_CODES = [
  'generic.bad_request',
  'generic.validation_failed',
  'generic.unauthorized',
  'generic.forbidden',
  'generic.not_found',
  'generic.conflict',
  'generic.rate_limited',
  'generic.internal',
  'generic.upstream_unavailable',
  'auth.invalid_credentials',
  'auth.email_already_registered',
  'auth.email_not_verified',
  'auth.session_invalid',
  'auth.verification_token_invalid',
  'auth.password_reset_token_invalid',
  'auth.two_factor_challenge_missing',
  'auth.two_factor_code_invalid',
  'auth.two_factor_already_enabled',
  'auth.two_factor_not_enabled',
  'auth.two_factor_setup_missing',
  // gen:error-codes
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

const ERROR_CODE_SET: ReadonlySet<string> = new Set(ERROR_CODES);

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && ERROR_CODE_SET.has(value);
}

/** Body of every non-2xx API response. */
export const ErrorResponseSchema = z.strictObject({
  code: z.enum(ERROR_CODES),
  message: z.string(),
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
