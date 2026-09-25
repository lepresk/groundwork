/**
 * Test environment: root `.env` when present, CI variables otherwise.
 * Each run uses its own queue prefix so a local dev worker never steals
 * test jobs (and vice versa).
 */
import { randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT_ENV_FILE = resolve(import.meta.dirname, '../../../.env');
if (existsSync(ROOT_ENV_FILE)) {
  process.loadEnvFile(ROOT_ENV_FILE);
}

process.env['NODE_ENV'] = 'test';
process.env['QUEUE_PREFIX'] = `groundwork-test-${randomUUID()}`;
process.env['REDIS_URL'] ??= 'redis://localhost:6379';
process.env['SMTP_HOST'] ??= 'localhost';
process.env['SMTP_PORT'] ??= '1025';
process.env['MAIL_FROM'] ??= 'Groundwork <no-reply@groundwork.local>';
