/**
 * Typed environment configuration, parsed once at import time.
 *
 * Loads the monorepo root `.env` when present (local development), then
 * validates `process.env` with Zod. Every other module imports `env` from
 * here and never reads `process.env` directly (enforced by ESLint).
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';

const ROOT_ENV_FILE = resolve(import.meta.dirname, '../../../../.env');
if (process.env['NODE_ENV'] !== 'test' && existsSync(ROOT_ENV_FILE)) {
  process.loadEnvFile(ROOT_ENV_FILE);
}

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

export const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.url(),
  QUEUE_PREFIX: z.string().min(1).default('groundwork'),
  WEB_PUBLIC_URL: z.url(),
  TRUST_CLIENT_IP_HEADER: booleanString.default(false),
  SESSION_SECRET: z.string().min(32),
  TWO_FACTOR_ENCRYPTION_KEY: z
    .string()
    .refine((value) => Buffer.from(value, 'base64').length === 32, 'Expected 32 bytes, base64'),
  AUTH_THROTTLE_LIMIT: z.coerce.number().int().positive().default(10),
});

export type Env = z.infer<typeof EnvSchema>;

function parseEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export const env: Env = parseEnv();
