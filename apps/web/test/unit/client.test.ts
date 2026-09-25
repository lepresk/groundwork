import { beforeEach, describe, expect, it, vi } from 'vitest';

const headersMock = vi.fn();
const upstream = vi.fn().mockResolvedValue({ status: 200 });
const createApiFetch = vi.fn(() => upstream);
vi.mock('next/headers', () => ({ headers: headersMock }));
vi.mock('next/server', () => ({ connection: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@lepresk/next-bff-fetch', () => ({ createApiFetch }));

const { apiFetch, buildForwardHeaders } = await import('@/lib/api/client');

describe('BFF client', () => {
  beforeEach(() => {
    headersMock.mockReset();
  });

  it('is configured lazily from the runtime env, once', async () => {
    expect(createApiFetch).not.toHaveBeenCalled();

    await apiFetch('/a');
    await apiFetch('/b', { method: 'POST' });

    expect(createApiFetch).toHaveBeenCalledTimes(1);
    expect(createApiFetch).toHaveBeenCalledWith(
      expect.objectContaining({ apiInternalUrl: 'http://api.test/api/v1' }),
    );
    expect(upstream).toHaveBeenLastCalledWith('/b', { method: 'POST' });
  });

  it('forwards the first client IP and the user agent', async () => {
    headersMock.mockResolvedValue(
      new Headers({ 'x-forwarded-for': '203.0.113.9, 10.0.0.1', 'user-agent': 'Browser' }),
    );

    expect(await buildForwardHeaders()).toEqual({
      'x-client-ip': '203.0.113.9',
      'x-client-user-agent': 'Browser',
    });
  });

  it('falls back to x-real-ip and omits missing values', async () => {
    headersMock.mockResolvedValue(new Headers({ 'x-real-ip': '198.51.100.2' }));

    expect(await buildForwardHeaders()).toEqual({ 'x-client-ip': '198.51.100.2' });
  });

  it('forwards nothing when the request carries no client metadata', async () => {
    headersMock.mockResolvedValue(new Headers());

    expect(await buildForwardHeaders()).toEqual({});
  });
});
