/**
 * Turns two-factor authentication off. Requires both the password and a
 * current TOTP code so a hijacked session alone cannot downgrade security.
 */
import { Injectable } from '@nestjs/common';
import { fail, ok, type Result, type TwoFactorDisableRequest } from '@groundwork/shared';
import { DbService } from '../../../shared/db/db.service.js';
import { isTwoFactorActive, TwoFactorRepository } from '../repositories/two-factor.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';
import { AuthEmails } from '../services/auth-emails.service.js';
import { PasswordHasher } from '../services/password-hasher.service.js';
import { TotpService } from '../services/totp.service.js';

export type DisableTwoFactorError =
  | 'auth.two_factor_not_enabled'
  | 'auth.invalid_credentials'
  | 'auth.two_factor_code_invalid'
  | 'auth.session_invalid';

@Injectable()
export class DisableTwoFactorAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly twoFactor: TwoFactorRepository,
    private readonly passwords: PasswordHasher,
    private readonly totp: TotpService,
    private readonly emails: AuthEmails,
  ) {}

  async execute(
    userId: string,
    input: TwoFactorDisableRequest,
  ): Promise<Result<null, DisableTwoFactorError>> {
    return this.db.transaction(async (tx) => {
      const [user, credential] = await Promise.all([
        this.users.findById(tx, userId),
        this.twoFactor.findCredential(tx, userId),
      ]);
      if (user === null) {
        return fail('auth.session_invalid');
      }
      if (!isTwoFactorActive(credential)) {
        return fail('auth.two_factor_not_enabled');
      }
      if (!(await this.passwords.verify(user.passwordHash, input.password))) {
        return fail('auth.invalid_credentials');
      }
      if (!(await this.totp.verify(credential.encryptedSecret, input.code))) {
        return fail('auth.two_factor_code_invalid');
      }
      await this.twoFactor.remove(tx, userId);
      this.emails.sendTwoFactorChanged(user, false);
      return ok(null);
    });
  }
}
