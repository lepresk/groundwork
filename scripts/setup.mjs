#!/usr/bin/env node
/**
 * First-run setup: creates local env files from their examples and fills
 * every empty secret with a freshly generated value. Idempotent: existing
 * env files are never overwritten.
 */
import { randomBytes } from 'node:crypto';
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');

/** Secrets generated on first setup, keyed by variable name. */
const GENERATED_SECRETS = {
  SESSION_SECRET: () => randomBytes(48).toString('base64url'),
  TWO_FACTOR_ENCRYPTION_KEY: () => randomBytes(32).toString('base64'),
};

const ENV_FILES = [
  { example: '.env.example', target: '.env' },
  { example: 'apps/web/.env.example', target: 'apps/web/.env.local' },
];

for (const { example, target } of ENV_FILES) {
  const targetPath = resolve(ROOT, target);
  if (existsSync(targetPath)) {
    console.log(`skip    ${target} (already exists)`);
    continue;
  }
  copyFileSync(resolve(ROOT, example), targetPath);

  let content = readFileSync(targetPath, 'utf8');
  for (const [name, generate] of Object.entries(GENERATED_SECRETS)) {
    content = content.replace(new RegExp(`^${name}=$`, 'm'), `${name}=${generate()}`);
  }
  writeFileSync(targetPath, content);
  console.log(`create  ${target}`);
}

console.log('\nNext: pnpm infra:up && pnpm build && pnpm db:migrate && pnpm dev');
