/**
 * Persistence for the server-side session registry.
 */
import { Injectable } from '@nestjs/common';
import { authSessions, type AuthSessionRow } from '@groundwork/db';
import { and, eq, gt, isNull } from 'drizzle-orm';
import type { DbExecutor } from '../../../shared/db/db.service.js';
import type { ClientContext } from '../../../shared/http/client-context.js';
import { SESSION_ACTIVITY_WRITE_INTERVAL_MS, SESSION_IDLE_TTL_MS } from '../auth.constants.js';

@Injectable()
export class AuthSessionsRepository {
  async create(
    db: DbExecutor,
    input: { userId: string; client: ClientContext; expiresAt: Date },
  ): Promise<string> {
    const [row] = await db
      .insert(authSessions)
      .values({
        userId: input.userId,
        ipAddress: input.client.ipAddress,
        userAgent: input.client.userAgent,
        expiresAt: input.expiresAt,
      })
      .returning({ id: authSessions.id });
    if (row === undefined) {
      throw new Error('Session insert returned no row.');
    }
    return row.id;
  }

  async findActive(
    db: DbExecutor,
    sessionId: string,
    userId: string,
  ): Promise<AuthSessionRow | null> {
    const [row] = await db
      .select()
      .from(authSessions)
      .where(
        and(
          eq(authSessions.id, sessionId),
          eq(authSessions.userId, userId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);
    return row ?? null;
  }

  /**
   * Records activity at most once per write interval and keeps the session
   * alive for at least the idle TTL. Remember-me sessions, whose expiry is
   * already further away, are not shortened.
   */
  async recordActivity(db: DbExecutor, session: AuthSessionRow, now = new Date()): Promise<void> {
    if (now.getTime() - session.lastActivityAt.getTime() < SESSION_ACTIVITY_WRITE_INTERVAL_MS) {
      return;
    }
    const idleExpiry = new Date(now.getTime() + SESSION_IDLE_TTL_MS);
    await db
      .update(authSessions)
      .set({
        lastActivityAt: now,
        expiresAt: idleExpiry > session.expiresAt ? idleExpiry : session.expiresAt,
      })
      .where(eq(authSessions.id, session.id));
  }

  async revoke(db: DbExecutor, sessionId: string): Promise<void> {
    await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessions.id, sessionId), isNull(authSessions.revokedAt)));
  }

  async revokeAllForUser(db: DbExecutor, userId: string): Promise<void> {
    await db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessions.userId, userId), isNull(authSessions.revokedAt)));
  }
}
