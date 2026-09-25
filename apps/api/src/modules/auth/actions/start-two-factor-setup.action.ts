/**
 * Generates a new TOTP secret for the user to scan. The secret stays
 * pending until `EnableTwoFactorAction` confirms a first valid code.
 */
import { Injectable } from '@nestjs/common';
import { fail, ok, type Result, type TwoFactorSetupResponse } from '@groundwork/shared';
import { DbService } from '../../../shared/db/db.service.js';
import { isTwoFactorActive, TwoFactorRepository } from '../repositories/two-factor.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { TotpService } from '../services/totp.service.js';

export type StartTwoFactorSetupError = 'auth.two_factor_already_enabled' | 'auth.session_invalid';

@Injectable()
export class StartTwoFactorSetupAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly twoFactor: TwoFactorRepository,
    private readonly totp: TotpService,
  ) {}

  async execute(userId: string): Promise<Result<TwoFactorSetupResponse, StartTwoFactorSetupError>> {
    return this.db.transaction(async (tx) => {
      const [user, credential] = await Promise.all([
        this.users.findById(tx, userId),
        this.twoFactor.findCredential(tx, userId),
      ]);
      if (user === null) {
        return fail('auth.session_invalid');
      }
      if (isTwoFactorActive(credential)) {
        return fail('auth.two_factor_already_enabled');
      }
      const { secret, encryptedSecret, otpauthUrl } = this.totp.createSecret(user.email);
      await this.twoFactor.savePendingSecret(tx, userId, encryptedSecret);
      return ok({ secret, otpauthUrl });
    });
  }
}
