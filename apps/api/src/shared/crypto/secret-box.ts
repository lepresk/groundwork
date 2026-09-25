/**
 * Authenticated symmetric encryption (AES-256-GCM) for secrets that must be
 * recovered in clear, such as TOTP seeds. Output format:
 * `v1.<iv>.<authTag>.<ciphertext>`, each part base64url encoded, so the key
 * or algorithm can be rotated later by bumping the version prefix.
 */
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const VERSION = 'v1';
const IV_BYTES = 12;

export class SecretBox {
  private readonly key: Buffer;

  constructor(base64Key: string) {
    this.key = Buffer.from(base64Key, 'base64');
    if (this.key.length !== 32) {
      throw new Error('SecretBox requires a 32-byte key.');
    }
  }

  seal(plaintext: string): string {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    return [VERSION, iv, cipher.getAuthTag(), ciphertext]
      .map((part) => (typeof part === 'string' ? part : part.toString('base64url')))
      .join('.');
  }

  open(sealed: string): string {
    const [version, iv, authTag, ciphertext] = sealed.split('.');
    if (
      version !== VERSION ||
      iv === undefined ||
      authTag === undefined ||
      ciphertext === undefined
    ) {
      throw new Error('Unsupported sealed secret format.');
    }
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, 'base64url'));
    decipher.setAuthTag(Buffer.from(authTag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertext, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
