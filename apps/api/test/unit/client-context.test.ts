import type { Request } from 'express';
import { afterEach, describe, expect, it, vi } from 'vitest';

function fakeRequest(headers: Record<string, string | string[]>, ip?: string): Request {
  return { headers, ip } as unknown as Request;
}

async function loadWithTrust(trust: boolean) {
  vi.resetModules();
  vi.doMock('../../src/config/env.js', () => ({ env: { TRUST_CLIENT_IP_HEADER: trust } }));
  return import('../../src/shared/http/client-context.js');
}

describe('resolveClientContext', () => {
  afterEach(() => {
    vi.doUnmock('../../src/config/env.js');
  });

  it('uses the BFF-forwarded headers when they are trusted', async () => {
    const { resolveClientContext } = await loadWithTrust(true);

    const context = resolveClientContext(
      fakeRequest(
        { 'x-client-ip': ['198.51.100.1', '10.0.0.1'], 'x-client-user-agent': 'Browser' },
        '10.0.0.2',
      ),
    );

    expect(context).toEqual({ ipAddress: '198.51.100.1', userAgent: 'Browser' });
  });

  it('falls back to the socket when forwarded headers are absent', async () => {
    const { resolveClientContext } = await loadWithTrust(true);

    const context = resolveClientContext(fakeRequest({ 'user-agent': 'curl' }));

    expect(context).toEqual({ ipAddress: null, userAgent: 'curl' });
  });

  it('ignores forwarded headers when they are not trusted', async () => {
    const { resolveClientContext } = await loadWithTrust(false);

    const context = resolveClientContext(
      fakeRequest({ 'x-client-ip': '198.51.100.1', 'user-agent': '' }, '10.0.0.2'),
    );

    expect(context).toEqual({ ipAddress: '10.0.0.2', userAgent: null });
  });
});
