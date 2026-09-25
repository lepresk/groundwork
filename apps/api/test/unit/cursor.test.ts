import { describe, expect, it } from 'vitest';
import { decodeCursor, encodeCursor, toPage } from '../../src/shared/pagination/cursor.js';

const position = { createdAt: new Date('2026-01-02T03:04:05.678Z'), id: 'a1b2' };

describe('cursor', () => {
  it('round-trips a position', () => {
    expect(decodeCursor(encodeCursor(position))).toEqual(position);
  });

  it.each([
    '',
    'bm9waXBl',
    Buffer.from('not-a-date|id').toString('base64url'),
    Buffer.from('2026-01-01T00:00:00Z|').toString('base64url'),
  ])('rejects the malformed cursor %j', (cursor) => {
    expect(decodeCursor(cursor)).toBeNull();
  });

  it('returns a next cursor only when an extra row was fetched', () => {
    const rows = [position, { ...position, id: 'b' }, { ...position, id: 'c' }];

    expect(toPage(rows, 2)).toEqual({
      items: rows.slice(0, 2),
      nextCursor: encodeCursor(rows[1] ?? position),
    });
    expect(toPage(rows, 3).nextCursor).toBeNull();
  });
});
