import { describe, expect, it } from 'vitest';
import { ErrorResponseSchema, isErrorCode } from '../src/errors.js';

describe('isErrorCode', () => {
  it('accepts a registered code', () => {
    expect(isErrorCode('auth.invalid_credentials')).toBe(true);
  });

  it('rejects unknown strings and non-strings', () => {
    expect(isErrorCode('auth.unknown')).toBe(false);
    expect(isErrorCode(42)).toBe(false);
  });
});

describe('ErrorResponseSchema', () => {
  it('rejects extra fields so leaked internals fail loudly', () => {
    const result = ErrorResponseSchema.safeParse({
      code: 'generic.internal',
      message: 'Boom',
      stack: 'at x',
    });

    expect(result.success).toBe(false);
  });
});
