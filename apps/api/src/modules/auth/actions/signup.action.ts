/**
 * Registers a new account and emails a verification link. The account
 * cannot sign in until the email is verified.
 */
import { Injectable } from '@nestjs/common';
import { isUniqueViolation } from '@groundwork/db';
import { fail, ok, type Result, type SignupRequest } from '@groundwork/shared';
import { generateUrlToken, hashToken } from '../../../shared/crypto/tokens.js';
import { DbService } from '../../../shared/db/db.service.js';
import { EMAIL_VERIFICATION_TTL_MS } from '../auth.constants.js';
import { AuthTokensRepository } from '../repositories/auth-tokens.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { AuthEmails } from '../services/auth-emails.service.js';
import { PasswordHasher } from '../services/password-hasher.service.js';

export type SignupError = 'auth.email_already_registered';

@Injectable()
export class SignupAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly tokens: AuthTokensRepository,
    private readonly passwords: PasswordHasher,
    private readonly emails: AuthEmails,
  ) {}

  async execute(input: SignupRequest): Promise<Result<{ userId: string }, SignupError>> {
    const passwordHash = await this.passwords.hash(input.password);
    try {
      return await this.db.transaction(async (tx) => {
        const user = await this.users.create(tx, {
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
        });
        const token = generateUrlToken();
        await this.tokens.create(tx, {
          userId: user.id,
          purpose: 'email_verification',
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        });
        this.emails.sendVerification(user, token);
        return ok({ userId: user.id });
      });
    } catch (error) {
      if (isUniqueViolation(error, 'users_email_lower_unique')) {
        return fail('auth.email_already_registered');
      }
      throw error;
    }
  }
}
