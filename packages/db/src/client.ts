/**
 * Database client factory. Apps create exactly one handle at boot and close
 * the pool on shutdown; tests create their own handle against the test DB.
 */
import { resolve } from 'node:path';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema/index.js';

export type Database = NodePgDatabase<typeof schema>;

export interface DatabaseHandle {
  readonly db: Database;
  readonly pool: Pool;
}

/** Absolute path of the SQL migrations shipped with this package. */
export const MIGRATIONS_FOLDER = resolve(import.meta.dirname, '../drizzle');

export function createDatabase(connectionString: string): DatabaseHandle {
  const pool = new Pool({ connectionString });
  const db = drizzle(pool, { schema, casing: 'snake_case' });
  return { db, pool };
}
