#!/usr/bin/env node
/**
 * Documentation gate, run by lint-staged, the Claude Code hook, and CI.
 *
 * Every TypeScript and JavaScript file must open with a JSDoc header that
 * says what the file is for (after an optional shebang or `'use client'` /
 * `'use server'` directive). The header is the file's module documentation:
 * a reader, human or agent, learns the file's role without reading its body.
 *
 * Usage: `node scripts/check-docs.mjs [files...]`. Without arguments it
 * checks every file tracked by git.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const CODE_FILE = /\.(ts|tsx|js|mjs|cjs)$/;
const EXCLUDED = /(\.d\.ts$|(^|\/)drizzle\/)/;
const PREAMBLE = /^(#!.*|['"]use (client|server)['"];?|\s*)$/;
const MIN_HEADER_WORDS = 4;

const files =
  process.argv.length > 2
    ? process.argv.slice(2).map((file) => file.replace(`${process.cwd()}/`, ''))
    : execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split('\n').filter(Boolean);

/** Returns the text of the leading JSDoc block, or null when the file has none. */
function leadingDocBlock(source) {
  const lines = source.split('\n');
  let index = 0;
  while (index < lines.length && PREAMBLE.test(lines[index] ?? '')) {
    index += 1;
  }
  if (!lines[index]?.startsWith('/**')) {
    return null;
  }
  const end = lines.findIndex((line, lineIndex) => lineIndex >= index && line.includes('*/'));
  return end === -1 ? null : lines.slice(index, end + 1).join(' ');
}

const violations = [];
for (const file of files) {
  if (!CODE_FILE.test(file) || EXCLUDED.test(file)) {
    continue;
  }
  const block = leadingDocBlock(readFileSync(file, 'utf8'));
  if (block === null) {
    violations.push(`${file}  missing file header: start the file with a /** ... */ block`);
    continue;
  }
  const words = block.replace(/[/*]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (words.length < MIN_HEADER_WORDS) {
    violations.push(`${file}  file header too short: say what the file is for`);
  }
}

if (violations.length > 0) {
  console.error(violations.join('\n'));
  console.error(`\n${violations.length} file(s) without documentation.`);
  process.exit(1);
}
