#!/usr/bin/env node
/**
 * Claude Code PostToolUse hook: formats the edited file with Prettier, then
 * runs the text hygiene and file documentation checks on it. Exit code 2 feeds the failure back to
 * the agent so it fixes the file instead of moving on.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { relative } from 'node:path';

const FORMATTABLE = /\.(ts|tsx|js|mjs|cjs|json|md|mdc|css|ya?ml)$/;

const payload = JSON.parse(readFileSync(0, 'utf8'));
const filePath = payload?.tool_input?.file_path;
const root = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

if (typeof filePath !== 'string' || !existsSync(filePath) || !FORMATTABLE.test(filePath)) {
  process.exit(0);
}
const file = relative(root, filePath);
if (file.startsWith('..') || file.includes('node_modules')) {
  process.exit(0);
}

spawnSync('pnpm', ['exec', 'prettier', '--write', '--log-level', 'warn', file], {
  cwd: root,
  stdio: 'ignore',
});

for (const script of ['scripts/check-text.mjs', 'scripts/check-docs.mjs']) {
  const check = spawnSync('node', [script, file], { cwd: root, encoding: 'utf8' });
  if (check.status !== 0) {
    process.stderr.write(check.stderr);
    process.exit(2);
  }
}
