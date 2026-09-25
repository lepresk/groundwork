/**
 * Resolves the environment for the test process: the root `.env` when
 * present (local), otherwise variables injected by CI. `DATABASE_URL` is
 * always rebound to the dedicated test database.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT_ENV_FILE = resolve(import.meta.dirname, '../../../.env');

const TEST_DEFAULTS: Record<string, string> = {
  REDIS_URL: 'redis://localhost:6379',
  WEB_PUBLIC_URL: 'http://localhost:3000',
  SESSION_SECRET: 'test-session-secret-at-least-thirty-two-characters',
  TWO_FACTOR_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64'),
};

export function loadTestEnv(): void {
  if (existsSync(ROOT_ENV_FILE)) {
    process.loadEnvFile(ROOT_ENV_FILE);
  }
  const testDatabaseUrl = process.env['DATABASE_URL_TEST'];
  if (testDatabaseUrl === undefined || testDatabaseUrl === '') {
    throw new Error('DATABASE_URL_TEST is required: tests never run against the dev database.');
  }
  process.env['NODE_ENV'] = 'test';
  process.env['DATABASE_URL'] = testDatabaseUrl;
  process.env['AUTH_THROTTLE_LIMIT'] = '1000';
  process.env['TRUST_CLIENT_IP_HEADER'] = 'true';
  for (const [key, value] of Object.entries(TEST_DEFAULTS)) {
    if (process.env[key] === undefined || process.env[key] === '') {
      process.env[key] = value;
    }
  }
}
