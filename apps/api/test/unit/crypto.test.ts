import { randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { SecretBox } from '../../src/shared/crypto/secret-box.js';
import {
  generateRecoveryCode,
  generateUrlToken,
  hashToken,
} from '../../src/shared/crypto/tokens.js';

const KEY = randomBytes(32).toString('base64');

describe('SecretBox', () => {
  it('round-trips a secret with a random IV per seal', () => {
    const box = new SecretBox(KEY);

    const first = box.seal('JBSWY3DPEHPK3PXP');
    const second = box.seal('JBSWY3DPEHPK3PXP');

    expect(first).not.toBe(second);
    expect(box.open(first)).toBe('JBSWY3DPEHPK3PXP');
  });

  it('refuses a key that is not 32 bytes', () => {
    expect(() => new SecretBox(randomBytes(16).toString('base64'))).toThrow(/32-byte/);
  });

  it('detects tampering through the GCM auth tag', () => {
    const box = new SecretBox(KEY);
    const [version, iv, tag] = box.seal('secret').split('.');

    expect(() => box.open([version, iv, tag, 'AAAA'].join('.'))).toThrow();
  });

  it('refuses an unknown format or version', () => {
    const box = new SecretBox(KEY);

    expect(() => box.open('v2.a.b.c')).toThrow(/Unsupported/);
    expect(() => box.open('garbage')).toThrow(/Unsupported/);
  });

  it('cannot open a secret sealed with another key', () => {
    const sealed = new SecretBox(KEY).seal('secret');

    expect(() => new SecretBox(randomBytes(32).toString('base64')).open(sealed)).toThrow();
  });
});

describe('tokens', () => {
  it('generates URL-safe tokens with 256 bits of entropy', () => {
    const token = generateUrlToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(generateUrlToken()).not.toBe(token);
  });

  it('generates human-typable recovery codes', () => {
    expect(generateRecoveryCode()).toMatch(/^[0-9a-f]{5}-[0-9a-f]{5}$/);
  });

  it('hashes case- and whitespace-insensitively so typed codes still match', () => {
    expect(hashToken(' ABCDE-12345 ')).toBe(hashToken('abcde-12345'));
    expect(hashToken('abcde-12345')).toMatch(/^[0-9a-f]{64}$/);
  });
});
