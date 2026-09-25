/**
 * Emails a password reset link. Always succeeds so the response never
 * reveals whether an email is registered.
 */
import { Injectable } from '@nestjs/common';
import { generateUrlToken, hashToken } from '../../../shared/crypto/tokens.js';
import { DbService } from '../../../shared/db/db.service.js';
import { PASSWORD_RESET_TTL_MS } from '../auth.constants.js';
import { AuthTokensRepository } from '../repositories/auth-tokens.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { AuthEmails } from '../services/auth-emails.service.js';

@Injectable()
export class RequestPasswordResetAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly tokens: AuthTokensRepository,
    private readonly emails: AuthEmails,
  ) {}

  async execute(email: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const user = await this.users.findByEmail(tx, email);
      if (user === null) {
        return;
      }
      await this.tokens.consumeAllForUser(tx, user.id, 'password_reset');
      const token = generateUrlToken();
      await this.tokens.create(tx, {
        userId: user.id,
        purpose: 'password_reset',
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
      });
      this.emails.sendPasswordReset(user, token);
    });
  }
}
