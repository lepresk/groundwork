/**
 * Persistence for single-use emailed tokens. Only hashes are stored.
 */
import { Injectable } from '@nestjs/common';
import { authTokens, type AuthTokenPurpose, type AuthTokenRow } from '@groundwork/db';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { DbExecutor } from '../../../shared/db/db.service.js';

@Injectable()
export class AuthTokensRepository {
  async create(
    db: DbExecutor,
    input: { userId: string; purpose: AuthTokenPurpose; tokenHash: string; expiresAt: Date },
  ): Promise<void> {
    await db.insert(authTokens).values(input);
  }

  /** Returns the token when it exists, matches the purpose, is unused, and is unexpired. */
  async findUsable(
    db: DbExecutor,
    tokenHash: string,
    purpose: AuthTokenPurpose,
  ): Promise<AuthTokenRow | null> {
    const [row] = await db
      .select()
      .from(authTokens)
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.purpose, purpose),
          isNull(authTokens.consumedAt),
          gt(authTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  /** Consumes every open token of a purpose for a user, so older links die too. */
  async consumeAllForUser(
    db: DbExecutor,
    userId: string,
    purpose: AuthTokenPurpose,
  ): Promise<void> {
    await db
      .update(authTokens)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(authTokens.userId, userId),
          eq(authTokens.purpose, purpose),
          isNull(authTokens.consumedAt),
        ),
      );
  }
}
