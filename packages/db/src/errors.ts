/**
 * Postgres SQLSTATE helpers so callers never hard-code error codes.
 */
const UNIQUE_VIOLATION = '23505';
const FOREIGN_KEY_VIOLATION = '23503';

interface PgErrorShape {
  readonly code?: unknown;
  readonly constraint?: unknown;
  readonly cause?: unknown;
}

/** Drizzle wraps driver errors; the SQLSTATE lives either on the error or on its cause. */
function sqlState(error: unknown): { code: unknown; constraint: unknown } | null {
  if (typeof error !== 'object' || error === null) {
    return null;
  }
  const shape = error as PgErrorShape;
  if (typeof shape.code === 'string') {
    return { code: shape.code, constraint: shape.constraint };
  }
  return sqlState(shape.cause);
}

export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const state = sqlState(error);
  if (state?.code !== UNIQUE_VIOLATION) {
    return false;
  }
  return constraint === undefined || state.constraint === constraint;
}

export function isForeignKeyViolation(error: unknown): boolean {
  return sqlState(error)?.code === FOREIGN_KEY_VIOLATION;
}
