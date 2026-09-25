/**
 * Persistence for TOTP credentials and recovery codes.
 */
import { Injectable } from '@nestjs/common';
import {
  twoFactorCredentials,
  twoFactorRecoveryCodes,
  type TwoFactorCredentialRow,
} from '@groundwork/db';
import { and, eq, isNull } from 'drizzle-orm';
import type { DbExecutor } from '../../../shared/db/db.service.js';

export type ActiveTwoFactorCredential = TwoFactorCredentialRow & { enabledAt: Date };

/** A credential only protects the account once its setup has been confirmed. */
export function isTwoFactorActive(
  credential: TwoFactorCredentialRow | null,
): credential is ActiveTwoFactorCredential {
  return credential !== null && credential.enabledAt !== null;
}

@Injectable()
export class TwoFactorRepository {
  async findCredential(db: DbExecutor, userId: string): Promise<TwoFactorCredentialRow | null> {
    const [row] = await db
      .select()
      .from(twoFactorCredentials)
      .where(eq(twoFactorCredentials.userId, userId))
      .limit(1);
    return row ?? null;
  }

  /** Stores a new pending (not yet enabled) secret, replacing any previous pending one. */
  async savePendingSecret(db: DbExecutor, userId: string, encryptedSecret: string): Promise<void> {
    await db
      .insert(twoFactorCredentials)
      .values({ userId, encryptedSecret, enabledAt: null })
      .onConflictDoUpdate({
        target: twoFactorCredentials.userId,
        set: { encryptedSecret, enabledAt: null },
      });
  }

  async enable(db: DbExecutor, userId: string, at: Date): Promise<void> {
    await db
      .update(twoFactorCredentials)
      .set({ enabledAt: at })
      .where(eq(twoFactorCredentials.userId, userId));
  }

  async replaceRecoveryCodes(
    db: DbExecutor,
    userId: string,
    codeHashes: readonly string[],
  ): Promise<void> {
    await db.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, userId));
    await db
      .insert(twoFactorRecoveryCodes)
      .values(codeHashes.map((codeHash) => ({ userId, codeHash })));
  }

  /** Marks a recovery code as used. Returns false when no unused code matched. */
  async consumeRecoveryCode(db: DbExecutor, userId: string, codeHash: string): Promise<boolean> {
    const rows = await db
      .update(twoFactorRecoveryCodes)
      .set({ usedAt: new Date() })
      .where(
        and(
          eq(twoFactorRecoveryCodes.userId, userId),
          eq(twoFactorRecoveryCodes.codeHash, codeHash),
          isNull(twoFactorRecoveryCodes.usedAt),
        ),
      )
      .returning({ id: twoFactorRecoveryCodes.id });
    return rows.length > 0;
  }

  async remove(db: DbExecutor, userId: string): Promise<void> {
    await db.delete(twoFactorRecoveryCodes).where(eq(twoFactorRecoveryCodes.userId, userId));
    await db.delete(twoFactorCredentials).where(eq(twoFactorCredentials.userId, userId));
  }
}
