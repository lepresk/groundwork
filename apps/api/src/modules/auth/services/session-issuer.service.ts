/**
 * Opens server-side sessions with the lifetime matching "remember me".
 */
import { Injectable } from '@nestjs/common';
import type { DbExecutor } from '../../../shared/db/db.service.js';
import type { ClientContext } from '../../../shared/http/client-context.js';
import { SESSION_IDLE_TTL_MS, SESSION_REMEMBER_TTL_MS } from '../auth.constants.js';
import { AuthSessionsRepository } from '../repositories/auth-sessions.repository.js';

@Injectable()
export class SessionIssuer {
  constructor(private readonly sessions: AuthSessionsRepository) {}

  open(
    db: DbExecutor,
    userId: string,
    rememberMe: boolean,
    client: ClientContext,
  ): Promise<string> {
    const ttl = rememberMe ? SESSION_REMEMBER_TTL_MS : SESSION_IDLE_TTL_MS;
    return this.sessions.create(db, { userId, client, expiresAt: new Date(Date.now() + ttl) });
  }
}
