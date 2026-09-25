import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnvSchema } from '../../src/config/env.js';

const VALID = {
  DATABASE_URL: 'postgres://localhost/db',
  REDIS_URL: 'redis://localhost:6379',
  WEB_PUBLIC_URL: 'http://localhost:3000',
  SESSION_SECRET: 'x'.repeat(32),
  TWO_FACTOR_ENCRYPTION_KEY: Buffer.alloc(32).toString('base64'),
};

describe('EnvSchema', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('applies defaults and coerces types', () => {
    const env = EnvSchema.parse({ ...VALID, API_PORT: '4000', TRUST_CLIENT_IP_HEADER: 'true' });

    expect(env).toMatchObject({
      NODE_ENV: 'development',
      API_PORT: 4000,
      TRUST_CLIENT_IP_HEADER: true,
    });
  });

  it('rejects an encryption key that is not 32 bytes', () => {
    const result = EnvSchema.safeParse({ ...VALID, TWO_FACTOR_ENCRYPTION_KEY: 'c2hvcnQ=' });

    expect(result.success).toBe(false);
  });

  it('fails fast at import time with a readable report', async () => {
    vi.stubEnv('SESSION_SECRET', 'too-short');
    vi.resetModules();

    await expect(import('../../src/config/env.js')).rejects.toThrow(
      /Invalid environment configuration/,
    );
  });
});
