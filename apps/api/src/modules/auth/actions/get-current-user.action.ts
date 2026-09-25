/**
 * Loads the profile of the authenticated user.
 */
import { Injectable } from '@nestjs/common';
import { fail, ok, type Result, type UserProfile } from '@groundwork/shared';
import { DbService } from '../../../shared/db/db.service.js';
import { toUserProfile } from '../auth.mappers.js';
import { isTwoFactorActive, TwoFactorRepository } from '../repositories/two-factor.repository.js';
import { UsersRepository } from '../repositories/users.repository.js';

@Injectable()
export class GetCurrentUserAction {
  constructor(
    private readonly db: DbService,
    private readonly users: UsersRepository,
    private readonly twoFactor: TwoFactorRepository,
  ) {}

  async execute(userId: string): Promise<Result<UserProfile, 'auth.session_invalid'>> {
    const [user, credential] = await Promise.all([
      this.users.findById(this.db.client, userId),
      this.twoFactor.findCredential(this.db.client, userId),
    ]);
    if (user === null) {
      return fail('auth.session_invalid');
    }
    return ok(toUserProfile(user, isTwoFactorActive(credential)));
  }
}
