import { afterEach, describe, expect, it, vi } from 'vitest';

describe('serverEnv', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('rejects a missing or invalid API URL at first use', async () => {
    vi.stubEnv('API_INTERNAL_URL', 'not-a-url');
    const { serverEnv } = await import('@/lib/env');

    expect(() => serverEnv()).toThrow();
  });
});
