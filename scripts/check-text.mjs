#!/usr/bin/env node
/**
 * Text hygiene gate, run by lint-staged and CI.
 *
 * - No em dash (U+2014) anywhere: use `-`, `:` or rephrase.
 * - No emoji in source code (apps/, packages/): use an icon component.
 *
 * Usage: `node scripts/check-text.mjs [files...]`. Without arguments it
 * scans every file tracked by git.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { extname } from 'node:path';

const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.json',
  '.md',
  '.mdc',
  '.yml',
  '.yaml',
  '.css',
  '.sql',
]);
const SOURCE_PREFIXES = ['apps/', 'packages/'];
const EM_DASH = new RegExp(String.fromCodePoint(0x2014));
const EMOJI = /\p{Extended_Pictographic}/u;
const IGNORED = new Set(['pnpm-lock.yaml']);

const files =
  process.argv.length > 2
    ? process.argv.slice(2).map((file) => file.replace(`${process.cwd()}/`, ''))
    : execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);

const violations = [];
for (const file of files) {
  if (IGNORED.has(file) || !TEXT_EXTENSIONS.has(extname(file))) {
    continue;
  }
  const isSource = SOURCE_PREFIXES.some((prefix) => file.startsWith(prefix));
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, index) => {
      if (EM_DASH.test(line)) {
        violations.push(`${file}:${index + 1}  em dash (U+2014): use "-", ":" or rephrase`);
      }
      if (isSource && EMOJI.test(line)) {
        violations.push(`${file}:${index + 1}  emoji in source: use an icon component`);
      }
    });
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  console.error(`\n${violations.length} text hygiene violation(s).`);
  process.exit(1);
}
