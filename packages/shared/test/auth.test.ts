import { describe, expect, it } from 'vitest';
import {
  LoginRequestSchema,
  SignupRequestSchema,
  TwoFactorLoginRequestSchema,
} from '../src/auth.js';

describe('SignupRequestSchema', () => {
  it('normalizes the email to lower case', () => {
    const parsed = SignupRequestSchema.parse({
      email: 'Ada@Example.COM',
      password: 'correct-horse-battery',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(parsed.email).toBe('ada@example.com');
  });

  it('rejects a password shorter than the policy minimum', () => {
    const result = SignupRequestSchema.safeParse({
      email: 'ada@example.com',
      password: 'short',
      firstName: 'Ada',
      lastName: 'Lovelace',
    });

    expect(result.success).toBe(false);
  });
});

describe('LoginRequestSchema', () => {
  it('defaults rememberMe to false', () => {
    const parsed = LoginRequestSchema.parse({ email: 'ada@example.com', password: 'x' });

    expect(parsed.rememberMe).toBe(false);
  });
});

describe('TwoFactorLoginRequestSchema', () => {
  it('accepts either a TOTP code or a recovery code', () => {
    expect(TwoFactorLoginRequestSchema.safeParse({ code: '123456' }).success).toBe(true);
    expect(TwoFactorLoginRequestSchema.safeParse({ recoveryCode: 'abcd-efgh-ij' }).success).toBe(
      true,
    );
  });

  it('rejects a malformed TOTP code', () => {
    expect(TwoFactorLoginRequestSchema.safeParse({ code: '12ab56' }).success).toBe(false);
  });

  it('rejects both or neither of the two factors', () => {
    expect(TwoFactorLoginRequestSchema.safeParse({}).success).toBe(false);
    expect(
      TwoFactorLoginRequestSchema.safeParse({ code: '123456', recoveryCode: 'abcd-efgh-ij' })
        .success,
    ).toBe(false);
  });
});
