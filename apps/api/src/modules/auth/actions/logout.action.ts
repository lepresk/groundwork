/**
 * Revokes the current server-side session.
 */
import { Injectable } from '@nestjs/common';
import { DbService } from '../../../shared/db/db.service.js';
import { AuthSessionsRepository } from '../repositories/auth-sessions.repository.js';

@Injectable()
export class LogoutAction {
  constructor(
    private readonly db: DbService,
    private readonly sessions: AuthSessionsRepository,
  ) {}

  async execute(sessionId: string): Promise<void> {
    await this.sessions.revoke(this.db.client, sessionId);
  }
}
