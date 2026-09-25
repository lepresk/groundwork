/**
 * Activates a pending TOTP secret once the user proves possession with a
 * valid code, and returns freshly generated recovery codes (shown once).
 */
import { Injectable } from '@nestjs/common';
import {
  fail,
  ok,
  RECOVERY_CODE_COUNT,
  type Result,
  type TwoFactorEnableResponse,
} from '@groundwork/shared';
import { generateRecoveryCode, hashToken } from '../../../shared/crypto/tokens.js';
import { DbService } from '../../../shared/db/db.service.js';
import { TwoFactorRepository } from '../repositories/two-factor.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { AuthEmails } from '../services/auth-emails.service.js';
import { TotpService } from '../services/totp.service.js';

export type EnableTwoFactorError =
  | 'auth.two_factor_already_enabled'
  | 'auth.two_factor_setup_missing'
  | 'auth.two_factor_code_invalid'
  | 'auth.session_invalid';

@Injectable()
export class EnableTwoFactorAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly twoFactor: TwoFactorRepository,
    private readonly totp: TotpService,
    private readonly emails: AuthEmails,
  ) {}

  async execute(
    userId: string,
    code: string,
  ): Promise<Result<TwoFactorEnableResponse, EnableTwoFactorError>> {
    return this.db.transaction(async (tx) => {
      const [user, credential] = await Promise.all([
        this.users.findById(tx, userId),
        this.twoFactor.findCredential(tx, userId),
      ]);
      if (user === null) {
        return fail('auth.session_invalid');
      }
      if (credential === null) {
        return fail('auth.two_factor_setup_missing');
      }
      if (credential.enabledAt !== null) {
        return fail('auth.two_factor_already_enabled');
      }
      if (!(await this.totp.verify(credential.encryptedSecret, code))) {
        return fail('auth.two_factor_code_invalid');
      }

      const recoveryCodes = Array.from({ length: RECOVERY_CODE_COUNT }, generateRecoveryCode);
      await this.twoFactor.enable(tx, userId, new Date());
      await this.twoFactor.replaceRecoveryCodes(tx, userId, recoveryCodes.map(hashToken));
      this.emails.sendTwoFactorChanged(user, true);
      return ok({ recoveryCodes });
    });
  }
}
