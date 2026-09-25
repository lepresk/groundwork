import { describe, expect, it } from 'vitest';
import { fail, ok } from '../src/result.js';

describe('Result helpers', () => {
  it('builds success and failure variants', () => {
    expect(ok(1)).toEqual({ ok: true, value: 1 });
    expect(fail('nope')).toEqual({ ok: false, error: 'nope' });
  });
});
