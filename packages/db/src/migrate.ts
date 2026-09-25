/**
 * Applies pending SQL migrations without booting any application.
 * Used locally (`pnpm db:migrate`) and as the pre-deploy step in production.
 */
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { createDatabase, MIGRATIONS_FOLDER } from './client.js';

const rootEnvFile = resolve(import.meta.dirname, '../../../.env');
if (existsSync(rootEnvFile)) {
  process.loadEnvFile(rootEnvFile);
}

async function main(): Promise<void> {
  const url = process.env['DATABASE_URL'];
  if (url === undefined || url === '') {
    throw new Error('DATABASE_URL is required to run migrations.');
  }

  const { db, pool } = createDatabase(url);
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    process.stdout.write(`Migrations applied from ${MIGRATIONS_FOLDER}\n`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(
    `Migration failed: ${error instanceof Error ? error.message : String(error)}\n`,
  );
  process.exit(1);
});
