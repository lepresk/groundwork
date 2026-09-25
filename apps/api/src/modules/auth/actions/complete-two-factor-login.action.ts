/**
 * Completes a login started by `LoginAction` with a TOTP code or a
 * single-use recovery code.
 */
import { Injectable } from '@nestjs/common';
import {
  fail,
  ok,
  type Result,
  type TwoFactorLoginRequest,
  type UserProfile,
} from '@groundwork/shared';
import { hashToken } from '../../../shared/crypto/tokens.js';
import { DbService } from '../../../shared/db/db.service.js';
import type { ClientContext } from '../../../shared/http/client-context.js';
import { toUserProfile } from '../auth.mappers.js';
import { isTwoFactorActive, TwoFactorRepository } from '../repositories/two-factor.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { SessionIssuer } from '../services/session-issuer.service.js';
import { TotpService } from '../services/totp.service.js';
import type { TwoFactorChallenge } from '../session/session.types.js';

export type CompleteTwoFactorLoginError =
  'auth.two_factor_challenge_missing' | 'auth.two_factor_code_invalid';

@Injectable()
export class CompleteTwoFactorLoginAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly twoFactor: TwoFactorRepository,
    private readonly totp: TotpService,
    private readonly sessions: SessionIssuer,
  ) {}

  async execute(
    challenge: TwoFactorChallenge | undefined,
    input: TwoFactorLoginRequest,
    client: ClientContext,
  ): Promise<
    Result<
      { sessionId: string; user: UserProfile; rememberMe: boolean },
      CompleteTwoFactorLoginError
    >
  > {
    if (challenge === undefined || challenge.expiresAt < Date.now()) {
      return fail('auth.two_factor_challenge_missing');
    }

    return this.db.transaction(async (tx) => {
      const [user, credential] = await Promise.all([
        this.users.findById(tx, challenge.userId),
        this.twoFactor.findCredential(tx, challenge.userId),
      ]);
      if (user === null || !isTwoFactorActive(credential)) {
        return fail('auth.two_factor_challenge_missing');
      }

      const valid =
        input.code !== undefined
          ? await this.totp.verify(credential.encryptedSecret, input.code)
          : await this.twoFactor.consumeRecoveryCode(
              tx,
              user.id,
              hashToken(input.recoveryCode ?? ''),
            );
      if (!valid) {
        return fail('auth.two_factor_code_invalid');
      }

      const sessionId = await this.sessions.open(tx, user.id, challenge.rememberMe, client);
      return ok({ sessionId, user: toUserProfile(user, true), rememberMe: challenge.rememberMe });
    });
  }
}
