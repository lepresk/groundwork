/**
 * Consumes an email verification token and marks the address verified.
 */
import { Injectable } from '@nestjs/common';
import { fail, ok, type Result } from '@groundwork/shared';
import { hashToken } from '../../../shared/crypto/tokens.js';
import { DbService } from '../../../shared/db/db.service.js';
import { AuthTokensRepository } from '../repositories/auth-tokens.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';

export type VerifyEmailError = 'auth.verification_token_invalid';

@Injectable()
export class VerifyEmailAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly tokens: AuthTokensRepository,
  ) {}

  async execute(token: string): Promise<Result<null, VerifyEmailError>> {
    return this.db.transaction(async (tx) => {
      const row = await this.tokens.findUsable(tx, hashToken(token), 'email_verification');
      if (row === null) {
        return fail('auth.verification_token_invalid');
      }
      await this.users.markEmailVerified(tx, row.userId, new Date());
      await this.tokens.consumeAllForUser(tx, row.userId, 'email_verification');
      return ok(null);
    });
  }
}
