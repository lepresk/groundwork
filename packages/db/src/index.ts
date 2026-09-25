/**
 * Public entry of `@groundwork/db`: schema tables, the client factory, and
 * Postgres error helpers.
 */
export * from './schema/index.js';
export { createDatabase, MIGRATIONS_FOLDER, type Database, type DatabaseHandle } from './client.js';
export { isUniqueViolation, isForeignKeyViolation } from './errors.js';
