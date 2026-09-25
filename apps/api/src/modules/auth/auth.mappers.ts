/**
 * Maps persistence rows to API response shapes.
 */
import type { UserRow } from '@groundwork/db';
import type { UserProfile } from '@groundwork/shared';

export function toUserProfile(user: UserRow, twoFactorEnabled: boolean): UserProfile {
  if (user.emailVerifiedAt === null) {
    throw new Error('Only verified users can be exposed as a profile.');
  }
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    emailVerifiedAt: user.emailVerifiedAt.toISOString(),
    twoFactorEnabled,
    createdAt: user.createdAt.toISOString(),
  };
}
