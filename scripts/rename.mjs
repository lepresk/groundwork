#!/usr/bin/env node
/**
 * Turns a fresh fork of the template into your project:
 *
 *   pnpm rename acme-billing --title "Acme Billing"
 *
 * Rewrites the npm scope (@groundwork/*), cookie and queue names, database
 * identifiers, and display titles in every git-tracked file, then asks you
 * to run `pnpm install` to refresh the lockfile. Run it once, first thing.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseArgs } from 'node:util';

const ROOT = resolve(import.meta.dirname, '..');
const TEMPLATE = 'groundwork';
/** Files where identifiers must be valid SQL/infra names (snake_case). */
const INFRA_FILES = new Set([
  'docker-compose.yml',
  '.env.example',
  'docker/postgres/init/01-create-test-database.sql',
]);
const SKIPPED = new Set(['scripts/rename.mjs', 'LICENSE']);

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { title: { type: 'string' }, 'dry-run': { type: 'boolean', default: false } },
});
const [name] = positionals;

if (name === undefined || !/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error('Usage: pnpm rename <kebab-case-name> [--title "Display Name"] [--dry-run]');
  process.exit(1);
}
if (name === TEMPLATE) {
  console.error('Pick a name different from the template.');
  process.exit(1);
}

const snake = name.replaceAll('-', '_');
const title =
  values.title ??
  name
    .split('-')
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(' ');

const files = execFileSync('git', ['ls-files'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
let changed = 0;

for (const file of files) {
  if (SKIPPED.has(file)) {
    continue;
  }
  const path = resolve(ROOT, file);
  let source;
  try {
    source = readFileSync(path, 'utf8');
  } catch {
    continue;
  }
  if (!source.includes(TEMPLATE) && !source.includes('Groundwork')) {
    continue;
  }
  const identifier = INFRA_FILES.has(file) ? snake : name;
  const next = source
    .replaceAll(`@${TEMPLATE}/`, `@${name}/`)
    .replaceAll(`${TEMPLATE}_`, `${snake}_`)
    .replaceAll('Groundwork', title)
    .replaceAll(TEMPLATE, identifier);
  if (next !== source) {
    changed += 1;
    console.log(`update  ${file}`);
    if (!values['dry-run']) {
      writeFileSync(path, next);
    }
  }
}

console.log(`\n${changed} file(s) updated. Next: pnpm install && pnpm verify`);
