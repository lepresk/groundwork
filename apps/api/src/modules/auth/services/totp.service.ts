/**
 * RFC 6238 TOTP (30s step, 6 digits, SHA-1: the authenticator app default).
 * Secrets are encrypted at rest with `SecretBox`; this service is the only
 * place that sees them in clear.
 */
import { Injectable } from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';
import { env } from '../../../config/env.js';
import { SecretBox } from '../../../shared/crypto/secret-box.js';
import { TOTP_ISSUER } from '../auth.constants.js';

/** Accept the previous and next 30s step to absorb clock drift. */
const EPOCH_TOLERANCE_SECONDS = 30;

@Injectable()
export class TotpService {
  private readonly box = new SecretBox(env.TWO_FACTOR_ENCRYPTION_KEY);

  createSecret(accountEmail: string): {
    secret: string;
    encryptedSecret: string;
    otpauthUrl: string;
  } {
    const secret = generateSecret();
    return {
      secret,
      encryptedSecret: this.box.seal(secret),
      otpauthUrl: generateURI({ issuer: TOTP_ISSUER, label: accountEmail, secret }),
    };
  }

  async verify(encryptedSecret: string, code: string): Promise<boolean> {
    const result = await verify({
      secret: this.box.open(encryptedSecret),
      token: code,
      epochTolerance: EPOCH_TOLERANCE_SECONDS,
    });
    return result.valid;
  }
}
