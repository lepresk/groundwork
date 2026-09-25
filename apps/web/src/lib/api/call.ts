/**
 * Typed wrapper around `apiFetch`: validates the success body against the
 * shared Zod schema and normalizes every failure into an `ApiFailure` with
 * a stable error code. Pages and actions never touch raw responses.
 */
import 'server-only';
import { ErrorResponseSchema, type ErrorCode } from '@groundwork/shared';
import { applySessionSetCookies } from '@lepresk/next-bff-fetch';
import { SESSION_COOKIE_NAME } from '@groundwork/shared';
import type { z } from 'zod';
import { apiFetch } from './client';

export interface ApiFailure {
  readonly ok: false;
  readonly status: number;
  readonly code: ErrorCode;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export type ApiResult<T> = { readonly ok: true; readonly data: T } | ApiFailure;

interface CallOptions<TSchema extends z.ZodType | undefined> {
  readonly method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: unknown;
  /** Schema of the success body. Omit for endpoints that answer 202/204. */
  readonly schema?: TSchema;
  /** Relay the API's session cookie to the browser (login, logout, 2FA). */
  readonly relaySessionCookie?: boolean;
}

type Output<TSchema> = TSchema extends z.ZodType ? z.infer<TSchema> : null;

export async function callApi<TSchema extends z.ZodType | undefined = undefined>(
  path: string,
  options: CallOptions<TSchema> = {},
): Promise<ApiResult<Output<TSchema>>> {
  const response = await apiFetch(path, {
    method: options.method ?? 'GET',
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
  });

  if (options.relaySessionCookie === true) {
    await applySessionSetCookies(response.setCookieHeaders, {
      sessionCookieName: SESSION_COOKIE_NAME,
    });
  }

  if (response.status >= 200 && response.status < 300) {
    if (options.schema === undefined) {
      return { ok: true, data: null as Output<TSchema> };
    }
    const parsed = options.schema.safeParse(response.body);
    if (!parsed.success) {
      return failure(response.status, 'generic.internal');
    }
    return { ok: true, data: parsed.data as Output<TSchema> };
  }

  const error = ErrorResponseSchema.safeParse(response.body);
  if (!error.success) {
    return failure(
      response.status,
      response.status === 503 ? 'generic.upstream_unavailable' : 'generic.internal',
    );
  }
  return failure(response.status, error.data.code, extractFieldErrors(error.data.meta));
}

function failure(
  status: number,
  code: ErrorCode,
  fieldErrors: Record<string, string> = {},
): ApiFailure {
  return { ok: false, status, code, fieldErrors };
}

/** Turns `meta.issues` of a validation error into `{ field: message }`. */
function extractFieldErrors(meta: Record<string, unknown> | undefined): Record<string, string> {
  const issues = meta?.['issues'];
  if (!Array.isArray(issues)) {
    return {};
  }
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues as unknown[]) {
    if (typeof issue === 'object' && issue !== null && 'path' in issue && 'message' in issue) {
      const { path, message } = issue;
      if (typeof path === 'string' && typeof message === 'string' && !(path in fieldErrors)) {
        fieldErrors[path] = message;
      }
    }
  }
  return fieldErrors;
}
