#!/usr/bin/env node
/**
 * Deterministic code generator.
 *
 *   pnpm gen module <singular-kebab-name> [--plural <name>] [--dry-run]
 *
 * Creates a complete, tested feature slice (db table, shared contracts,
 * API module with actions, integration tests) and registers it at the
 * `gen:` markers. AI agents are expected to use this instead of writing
 * boilerplate by hand, so every module starts from the same conventions.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { buildNames } from './names.mjs';
import * as t from './templates.mjs';

const ROOT = resolve(import.meta.dirname, '../..');

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: { plural: { type: 'string' }, 'dry-run': { type: 'boolean', default: false } },
});
const [kind, name] = positionals;

if (kind !== 'module' || name === undefined) {
  console.error('Usage: pnpm gen module <singular-kebab-name> [--plural <name>] [--dry-run]');
  process.exit(1);
}

const n = buildNames(name, values.plural);
const dryRun = values['dry-run'];
const apiModule = `apps/api/src/modules/${n.kebabPlural}`;

const files = {
  [`packages/db/src/schema/${n.kebabPlural}.ts`]: t.schemaTable(n),
  [`packages/shared/src/${n.kebabPlural}.ts`]: t.sharedContracts(n),
  [`${apiModule}/${n.kebabPlural}.schemas.ts`]: t.apiSchemas(n),
  [`${apiModule}/${n.kebabPlural}.mappers.ts`]: t.apiMappers(n),
  [`${apiModule}/${n.kebabPlural}.repository.ts`]: t.apiRepository(n),
  [`${apiModule}/${n.kebabPlural}.controller.ts`]: t.controller(n),
  [`${apiModule}/${n.kebabPlural}.module.ts`]: t.nestModule(n),
  [`${apiModule}/actions/create-${n.kebab}.action.ts`]: t.createAction(n),
  [`${apiModule}/actions/get-${n.kebab}.action.ts`]: t.getAction(n),
  [`${apiModule}/actions/list-${n.kebabPlural}.action.ts`]: t.listAction(n),
  [`apps/api/test/integration/${n.kebabPlural}.test.ts`]: t.integrationTest(n),
};

/** Insertions before `// <marker>` lines, preserving the marker's indentation. */
const insertions = [
  [
    'packages/db/src/schema/index.ts',
    'gen:schema-exports',
    `export * from './${n.kebabPlural}.js';`,
  ],
  ['packages/shared/src/index.ts', 'gen:exports', `export * from './${n.kebabPlural}.js';`],
  ['packages/shared/src/errors.ts', 'gen:error-codes', `'${n.snake}.not_found',`],
  [
    'apps/api/src/shared/errors/error-catalog.ts',
    'gen:error-catalog',
    `'${n.snake}.not_found': { status: HttpStatus.NOT_FOUND, message: 'The ${n.title} was not found.' },`,
  ],
  [
    'apps/web/src/lib/errors.ts',
    'gen:error-messages',
    `'${n.snake}.not_found': 'This ${n.title} no longer exists.',`,
  ],
  [
    'apps/api/src/app.module.ts',
    'gen:module-imports',
    `import { ${n.pascalPlural}Module } from './modules/${n.kebabPlural}/${n.kebabPlural}.module.js';`,
  ],
  ['apps/api/src/app.module.ts', 'gen:modules', `${n.pascalPlural}Module,`],
];

for (const path of Object.keys(files)) {
  if (existsSync(resolve(ROOT, path))) {
    console.error(`Refusing to overwrite existing file: ${path}`);
    process.exit(1);
  }
}

for (const [path, content] of Object.entries(files)) {
  console.log(`create  ${path}`);
  if (!dryRun) {
    mkdirSync(dirname(resolve(ROOT, path)), { recursive: true });
    writeFileSync(resolve(ROOT, path), content);
  }
}

for (const [path, marker, line] of insertions) {
  const absolute = resolve(ROOT, path);
  const source = readFileSync(absolute, 'utf8');
  const match = source.match(new RegExp(`^([ \\t]*)// ${marker}$`, 'm'));
  if (match === null) {
    console.error(`Marker "// ${marker}" not found in ${path}`);
    process.exit(1);
  }
  console.log(`update  ${path}`);
  if (!dryRun) {
    writeFileSync(absolute, source.replace(match[0], `${match[1]}${line}\n${match[0]}`));
  }
}

console.log(`
Next steps:
  pnpm --filter @groundwork/db build && pnpm --filter @groundwork/shared build
  pnpm db:generate --name add_${n.snakePlural}
  pnpm db:migrate
  pnpm format && pnpm --filter @groundwork/api test
Then replace the placeholder \`name\` column with the real fields.`);
