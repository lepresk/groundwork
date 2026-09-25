/**
 * Cursor page query defaults, coercion, bounds, and the page envelope.
 */
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { CursorPageQuerySchema, PAGE_SIZE_DEFAULT, cursorPageSchema } from '../src/pagination.js';

describe('CursorPageQuerySchema', () => {
  it('applies the default page size and coerces query strings', () => {
    expect(CursorPageQuerySchema.parse({}).limit).toBe(PAGE_SIZE_DEFAULT);
    expect(CursorPageQuerySchema.parse({ limit: '5' }).limit).toBe(5);
  });

  it('rejects a page size above the maximum', () => {
    expect(CursorPageQuerySchema.safeParse({ limit: '1000' }).success).toBe(false);
  });
});

describe('cursorPageSchema', () => {
  it('wraps items with a nullable next cursor', () => {
    const schema = cursorPageSchema(z.strictObject({ id: z.string() }));

    expect(schema.parse({ items: [{ id: 'a' }], nextCursor: null }).items).toHaveLength(1);
  });
});
