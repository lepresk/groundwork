import { SESSION_COOKIE_NAME } from '@groundwork/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

const apiFetch = vi.fn();
const applySessionSetCookies = vi.fn();
vi.mock('@/lib/api/client', () => ({ apiFetch }));
vi.mock('@lepresk/next-bff-fetch', () => ({ applySessionSetCookies }));

const { callApi } = await import('@/lib/api/call');

function response(status: number, body: unknown, setCookieHeaders: string[] = []) {
  return { status, body, rawText: '', setCookieHeaders, retryAfterSeconds: undefined };
}

describe('callApi', () => {
  beforeEach(() => {
    apiFetch.mockReset();
    applySessionSetCookies.mockReset();
  });

  it('returns the body parsed with the success schema', async () => {
    apiFetch.mockResolvedValue(response(200, { id: 'a' }));

    const result = await callApi('/x', { schema: z.strictObject({ id: z.string() }) });

    expect(result).toEqual({ ok: true, data: { id: 'a' } });
    expect(apiFetch).toHaveBeenCalledWith('/x', { method: 'GET' });
  });

  it('serializes the body and returns null data without a schema', async () => {
    apiFetch.mockResolvedValue(response(204, null));

    const result = await callApi('/x', { method: 'POST', body: { a: 1 } });

    expect(result).toEqual({ ok: true, data: null });
    expect(apiFetch).toHaveBeenCalledWith('/x', { method: 'POST', body: '{"a":1}' });
  });

  it('treats a success body that breaks the contract as an internal error', async () => {
    apiFetch.mockResolvedValue(response(200, { id: 42 }));

    const result = await callApi('/x', { schema: z.strictObject({ id: z.string() }) });

    expect(result).toMatchObject({ ok: false, code: 'generic.internal' });
  });

  it('maps a canonical error body with validation issues to field errors', async () => {
    apiFetch.mockResolvedValue(
      response(400, {
        code: 'generic.validation_failed',
        message: 'Invalid',
        meta: {
          issues: [
            { path: 'email', code: 'invalid_format', message: 'Invalid email' },
            { path: 'email', code: 'too_small', message: 'Second message' },
            'garbage',
          ],
        },
      }),
    );

    const result = await callApi('/x');

    expect(result).toEqual({
      ok: false,
      status: 400,
      code: 'generic.validation_failed',
      fieldErrors: { email: 'Invalid email' },
    });
  });

  it('ignores malformed meta', async () => {
    apiFetch.mockResolvedValue(
      response(409, { code: 'generic.conflict', message: 'x', meta: { issues: 'no' } }),
    );

    expect(await callApi('/x')).toMatchObject({ code: 'generic.conflict', fieldErrors: {} });
  });

  it.each([
    [503, 'generic.upstream_unavailable'],
    [502, 'generic.internal'],
  ])('maps a non-canonical %i to %s', async (status, code) => {
    apiFetch.mockResolvedValue(response(status, '<html>'));

    expect(await callApi('/x')).toMatchObject({ ok: false, code });
  });

  it('relays the session cookie only when asked', async () => {
    apiFetch.mockResolvedValue(response(200, null, [`${SESSION_COOKIE_NAME}=abc; HttpOnly`]));

    await callApi('/x');
    await callApi('/x', { relaySessionCookie: true });

    expect(applySessionSetCookies).toHaveBeenCalledTimes(1);
    expect(applySessionSetCookies).toHaveBeenCalledWith([`${SESSION_COOKIE_NAME}=abc; HttpOnly`], {
      sessionCookieName: SESSION_COOKIE_NAME,
    });
  });
});
