/**
 * Cursor pagination contracts. Time-ordered resources are always paginated
 * by an opaque cursor; offsets are reserved for small fixed lists.
 */
import { z } from 'zod';

export const PAGE_SIZE_DEFAULT = 20;
export const PAGE_SIZE_MAX = 100;

export const CursorPageQuerySchema = z.strictObject({
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(PAGE_SIZE_MAX).default(PAGE_SIZE_DEFAULT),
});

export type CursorPageQuery = z.infer<typeof CursorPageQuerySchema>;

/** Wraps an item schema into the canonical list response envelope. */
export function cursorPageSchema<TItem extends z.ZodType>(item: TItem) {
  return z.strictObject({
    items: z.array(item),
    nextCursor: z.string().nullable(),
  });
}
