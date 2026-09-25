/**
 * Verifies credentials. Returns either an authenticated session or, when
 * the account has two-factor enabled, a challenge to complete with a code.
 */
import { Injectable } from '@nestjs/common';
import { fail, ok, type LoginRequest, type Result, type UserProfile } from '@groundwork/shared';
import { DbService } from '../../../shared/db/db.service.js';
import type { ClientContext } from '../../../shared/http/client-context.js';
import { toUserProfile } from '../auth.mappers.js';
import { TWO_FACTOR_CHALLENGE_TTL_MS } from '../auth.constants.js';
import { isTwoFactorActive, TwoFactorRepository } from '../repositories/two-factor.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { PasswordHasher } from '../services/password-hasher.service.js';
import type { TwoFactorChallenge } from '../session/session.types.js';
import { SessionIssuer } from '../services/session-issuer.service.js';

export type LoginError = 'auth.invalid_credentials' | 'auth.email_not_verified';

export type LoginOutcome =
  | {
      readonly kind: 'authenticated';
      readonly sessionId: string;
      readonly user: UserProfile;
      readonly rememberMe: boolean;
    }
  | { readonly kind: 'two_factor_required'; readonly challenge: TwoFactorChallenge };

@Injectable()
export class LoginAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly twoFactor: TwoFactorRepository,
    private readonly passwords: PasswordHasher,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(
    input: LoginRequest,
    client: ClientContext,
  ): Promise<Result<LoginOutcome, LoginError>> {
    const user = await this.users.findByEmail(this.db.client, input.email);
    const passwordValid = await this.passwords.verifyOrWaste(user?.passwordHash, input.password);
    if (user === null || !passwordValid) {
      return fail('auth.invalid_credentials');
    }
    if (user.emailVerifiedAt === null) {
      return fail('auth.email_not_verified');
    }

    const credential = await this.twoFactor.findCredential(this.db.client, user.id);
    if (isTwoFactorActive(credential)) {
      return ok({
        kind: 'two_factor_required',
        challenge: {
          userId: user.id,
          rememberMe: input.rememberMe,
          expiresAt: Date.now() + TWO_FACTOR_CHALLENGE_TTL_MS,
        },
      });
    }

    const sessionId = await this.sessions.open(this.db.client, user.id, input.rememberMe, client);
    return ok({
      kind: 'authenticated',
      sessionId,
      user: toUserProfile(user, false),
      rememberMe: input.rememberMe,
    });
  }
}
