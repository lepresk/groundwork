/**
 * Opaque keyset cursors for time-ordered lists (newest first).
 *
 * A cursor encodes the `(createdAt, id)` of the last item of a page; the
 * next page starts strictly after it. Keyset pagination stays fast and
 * stable under concurrent inserts, unlike offsets.
 */
import { and, desc, eq, lt, or, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

export interface CursorPosition {
  readonly createdAt: Date;
  readonly id: string;
}

export function encodeCursor(position: CursorPosition): string {
  return Buffer.from(`${position.createdAt.toISOString()}|${position.id}`).toString('base64url');
}

/** Returns null for any malformed cursor instead of throwing. */
export function decodeCursor(cursor: string): CursorPosition | null {
  const [iso, id] = Buffer.from(cursor, 'base64url').toString('utf8').split('|');
  if (iso === undefined || id === undefined || id === '') {
    return null;
  }
  const createdAt = new Date(iso);
  return Number.isNaN(createdAt.getTime()) ? null : { createdAt, id };
}

/**
 * `WHERE (created_at, id) < (cursor.createdAt, cursor.id)` for newest-first lists.
 * @public Used by modules created with `pnpm gen module`.
 */
export function afterCursor(
  columns: { createdAt: PgColumn; id: PgColumn },
  position: CursorPosition,
): SQL | undefined {
  return or(
    lt(columns.createdAt, position.createdAt),
    and(eq(columns.createdAt, position.createdAt), lt(columns.id, position.id)),
  );
}

/** @public Used by modules created with `pnpm gen module`. */
export function newestFirst(columns: { createdAt: PgColumn; id: PgColumn }): SQL[] {
  return [desc(columns.createdAt), desc(columns.id)];
}

/**
 * Splits a `limit + 1` query result into a page and the next cursor.
 * Fetching one extra row tells whether another page exists without a count.
 */
export function toPage<TRow extends CursorPosition>(
  rows: readonly TRow[],
  limit: number,
): { items: TRow[]; nextCursor: string | null } {
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor: rows.length > limit && last !== undefined ? encodeCursor(last) : null,
  };
}
