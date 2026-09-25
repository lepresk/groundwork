/**
 * Applies migrations to the test database once per test run.
 */
import { createDatabase, MIGRATIONS_FOLDER } from '@groundwork/db';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { loadTestEnv } from './load-test-env.js';

export default async function globalSetup(): Promise<void> {
  loadTestEnv();
  const { db, pool } = createDatabase(process.env['DATABASE_URL'] ?? '');
  try {
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}
