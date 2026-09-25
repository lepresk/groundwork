/**
 * Authenticates a request from its session cookie against the
 * `auth_sessions` registry, slides the idle expiry, and attaches the
 * session to `request.auth`.
 */
import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Response } from 'express';
import { DbService } from '../../../shared/db/db.service.js';
import { DomainException } from '../../../shared/errors/domain-exception.js';
import { AuthSessionsRepository } from '../repositories/auth-sessions.repository.js';
import { SessionCookieService } from './session-cookie.service.js';
import type { AuthenticatedRequest } from './session.types.js';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly cookies: SessionCookieService,
    private readonly sessions: AuthSessionsRepository,
    private readonly db: DbService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<AuthenticatedRequest>();
    const cookie = await this.cookies.read(request, http.getResponse<Response>());

    const { sessionId, userId } = cookie;
    if (sessionId === undefined || userId === undefined) {
      throw new DomainException('auth.session_invalid');
    }

    const row = await this.sessions.findActive(this.db.client, sessionId, userId);
    if (row === null) {
      throw new DomainException('auth.session_invalid');
    }

    await this.sessions.recordActivity(this.db.client, row);
    request.auth = { sessionId, userId };
    return true;
  }
}
