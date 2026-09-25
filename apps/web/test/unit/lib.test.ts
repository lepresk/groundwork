/**
 * Web helpers: safe redirects, Zod field errors, action results, and error copy.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { actionFailure, invalidInput } from '@/lib/action-result';
import { ERROR_MESSAGES, errorMessage } from '@/lib/errors';
import { safeRedirectPath } from '@/lib/safe-redirect';
import { fieldErrorsFromZod } from '@/lib/validation';

describe('safeRedirectPath', () => {
  it.each([
    ['/settings/security', '/settings/security'],
    [undefined, '/dashboard'],
    ['https://evil.test', '/dashboard'],
    ['//evil.test', '/dashboard'],
    ['/\\evil.test', '/dashboard'],
    ['/redirect?to=https://evil.test', '/dashboard'],
  ])('maps %s to %s', (candidate, expected) => {
    expect(safeRedirectPath(candidate)).toBe(expected);
  });
});

describe('fieldErrorsFromZod', () => {
  it('keeps the first message per field path', () => {
    const result = z
      .object({ email: z.email().min(50), profile: z.object({ name: z.string() }) })
      .safeParse({ email: 'x', profile: {} });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(Object.keys(fieldErrorsFromZod(result.error))).toEqual(['email', 'profile.name']);
    }
  });
});

describe('action results', () => {
  it('turns an API failure into user copy', () => {
    expect(actionFailure({ code: 'auth.invalid_credentials', fieldErrors: {} })).toEqual({
      ok: false,
      message: ERROR_MESSAGES['auth.invalid_credentials'],
      fieldErrors: {},
    });
  });

  it('reports invalid input with field errors', () => {
    expect(invalidInput({ email: 'Invalid' })).toMatchObject({
      ok: false,
      fieldErrors: { email: 'Invalid' },
    });
    expect(invalidInput().fieldErrors).toEqual({});
  });

  it('has a message for every error code', () => {
    expect(errorMessage('generic.internal')).toMatch(/went wrong/);
  });
});
