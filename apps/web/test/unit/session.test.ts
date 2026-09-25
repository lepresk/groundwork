import { beforeEach, describe, expect, it, vi } from 'vitest';

const callApi = vi.fn();
const redirect = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock('@/lib/api/call', () => ({ callApi }));
vi.mock('next/navigation', () => ({ redirect }));

const { getCurrentUser, requireUser } = await import('@/lib/session');

describe('session helpers', () => {
  beforeEach(() => {
    callApi.mockReset();
  });

  it('returns the profile when the session is valid', async () => {
    callApi.mockResolvedValue({ ok: true, data: { id: 'u' } });

    expect(await getCurrentUser()).toEqual({ id: 'u' });
    expect(await requireUser()).toEqual({ id: 'u' });
  });

  it('redirects to login without a valid session', async () => {
    callApi.mockResolvedValue({ ok: false, code: 'auth.session_invalid' });

    expect(await getCurrentUser()).toBeNull();
    await expect(requireUser()).rejects.toThrow('REDIRECT:/login');
  });
});
