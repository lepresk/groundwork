/**
 * Re-sends a verification link to an unverified account. Always succeeds so
 * the response never reveals whether an email is registered.
 */
import { Injectable } from '@nestjs/common';
import { generateUrlToken, hashToken } from '../../../shared/crypto/tokens.js';
import { DbService } from '../../../shared/db/db.service.js';
import { EMAIL_VERIFICATION_TTL_MS } from '../auth.constants.js';
import { AuthTokensRepository } from '../repositories/auth-tokens.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { AuthEmails } from '../services/auth-emails.service.js';

@Injectable()
export class ResendVerificationAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly tokens: AuthTokensRepository,
    private readonly emails: AuthEmails,
  ) {}

  async execute(email: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const user = await this.users.findByEmail(tx, email);
      if (user?.emailVerifiedAt !== null) {
        return;
      }
      await this.tokens.consumeAllForUser(tx, user.id, 'email_verification');
      const token = generateUrlToken();
      await this.tokens.create(tx, {
        userId: user.id,
        purpose: 'email_verification',
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      });
      this.emails.sendVerification(user, token);
    });
  }
}
