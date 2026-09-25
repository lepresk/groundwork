/**
 * High-entropy random tokens and their storage hashes. Tokens sent by email
 * or shown once (recovery codes) are stored as SHA-256 digests: they carry
 * enough entropy that a slow password hash would add cost without security.
 */
import { createHash, randomBytes } from 'node:crypto';

const URL_TOKEN_BYTES = 32;
const RECOVERY_CODE_BYTES = 5;
const RECOVERY_CODE_GROUP = 5;

export function generateUrlToken(): string {
  return randomBytes(URL_TOKEN_BYTES).toString('base64url');
}

/** Human-typable recovery code, e.g. `k3j9x-2mq7a`. */
export function generateRecoveryCode(): string {
  const raw = randomBytes(RECOVERY_CODE_BYTES * 2)
    .toString('hex')
    .slice(0, RECOVERY_CODE_GROUP * 2);
  return `${raw.slice(0, RECOVERY_CODE_GROUP)}-${raw.slice(RECOVERY_CODE_GROUP)}`;
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token.trim().toLowerCase()).digest('hex');
}
