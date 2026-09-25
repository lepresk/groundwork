/**
 * Server-only environment, validated on first use (at runtime, not at build
 * time), so one build artifact can be configured per environment. Nothing
 * here is exposed to the browser: the API URL stays private behind the BFF.
 */
import 'server-only';
import { z } from 'zod';

const EnvSchema = z.object({
  API_INTERNAL_URL: z.url(),
});

export type ServerEnv = z.infer<typeof EnvSchema>;

let cached: ServerEnv | undefined;

export function serverEnv(): ServerEnv {
  cached ??= EnvSchema.parse({ API_INTERNAL_URL: process.env['API_INTERNAL_URL'] });
  return cached;
}
