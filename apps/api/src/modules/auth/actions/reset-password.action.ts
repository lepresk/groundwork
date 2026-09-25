/**
 * Sets a new password from a reset token and revokes every open session.
 * Following the link also proves ownership of the email address.
 */
import { Injectable } from '@nestjs/common';
import { fail, ok, type ResetPasswordRequest, type Result } from '@groundwork/shared';
import { hashToken } from '../../../shared/crypto/tokens.js';
import { DbService } from '../../../shared/db/db.service.js';
import { AuthSessionsRepository } from '../repositories/auth-sessions.repository.js';
import { AuthTokensRepository } from '../repositories/auth-tokens.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { PasswordHasher } from '../services/password-hasher.service.js';

export type ResetPasswordError = 'auth.password_reset_token_invalid';

@Injectable()
export class ResetPasswordAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly tokens: AuthTokensRepository,
    private readonly sessions: AuthSessionsRepository,
    private readonly passwords: PasswordHasher,
  ) {}

  async execute(input: ResetPasswordRequest): Promise<Result<null, ResetPasswordError>> {
    const passwordHash = await this.passwords.hash(input.password);
    return this.db.transaction(async (tx) => {
      const row = await this.tokens.findUsable(tx, hashToken(input.token), 'password_reset');
      if (row === null) {
        return fail('auth.password_reset_token_invalid');
      }
      const now = new Date();
      await this.users.updatePassword(tx, row.userId, passwordHash, now);
      await this.users.markEmailVerified(tx, row.userId, now);
      await this.tokens.consumeAllForUser(tx, row.userId, 'password_reset');
      await this.sessions.revokeAllForUser(tx, row.userId);
      return ok(null);
    });
  }
}
