/**
 * Worker environment schema: defaults, coercion, and fail-fast import.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EnvSchema } from '../../src/config/env.js';

const VALID = {
  REDIS_URL: 'redis://localhost:6379',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  MAIL_FROM: 'App <a@b.co>',
};

describe('EnvSchema', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('applies defaults and coerces types', () => {
    expect(EnvSchema.parse({ ...VALID, SMTP_SECURE: 'true' })).toMatchObject({
      SMTP_PORT: 1025,
      SMTP_SECURE: true,
      WORKER_CONCURRENCY: 5,
      QUEUE_PREFIX: 'groundwork',
    });
  });

  it('fails fast at import time with a readable report', async () => {
    vi.stubEnv('REDIS_URL', 'not a url');

    await expect(import('../../src/config/env.js')).rejects.toThrow(
      /Invalid environment configuration/,
    );
  });
});
