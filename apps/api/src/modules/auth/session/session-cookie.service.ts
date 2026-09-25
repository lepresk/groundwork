/**
 * Reads and writes the sealed session cookie (iron-session). The cookie is
 * HttpOnly, SameSite=Lax, and Secure in production. "Remember me" sessions
 * get a persistent cookie; others a browser-session cookie. The server-side
 * `auth_sessions` row remains the source of truth for validity.
 */
import { Injectable } from '@nestjs/common';
import { SESSION_COOKIE_NAME } from '@groundwork/shared';
import type { Request, Response } from 'express';
import { getIronSession, type IronSession, type SessionOptions } from 'iron-session';
import { env } from '../../../config/env.js';
import { SESSION_REMEMBER_TTL_MS, TWO_FACTOR_CHALLENGE_TTL_MS } from '../auth.constants.js';
import type { SessionCookieData, TwoFactorChallenge } from './session.types.js';

type CookieLifetime = 'persistent' | 'browser' | 'challenge';

@Injectable()
export class SessionCookieService {
  async read(req: Request, res: Response): Promise<IronSession<SessionCookieData>> {
    return getIronSession<SessionCookieData>(req, res, this.options('persistent'));
  }

  async issueSession(
    req: Request,
    res: Response,
    identity: { sessionId: string; userId: string },
    rememberMe: boolean,
  ): Promise<void> {
    const session = await getIronSession<SessionCookieData>(
      req,
      res,
      this.options(rememberMe ? 'persistent' : 'browser'),
    );
    delete session.twoFactorChallenge;
    session.sessionId = identity.sessionId;
    session.userId = identity.userId;
    await session.save();
  }

  async issueTwoFactorChallenge(
    req: Request,
    res: Response,
    challenge: TwoFactorChallenge,
  ): Promise<void> {
    const session = await getIronSession<SessionCookieData>(req, res, this.options('challenge'));
    delete session.sessionId;
    delete session.userId;
    session.twoFactorChallenge = challenge;
    await session.save();
  }

  async clear(req: Request, res: Response): Promise<void> {
    (await this.read(req, res)).destroy();
  }

  private options(lifetime: CookieLifetime): SessionOptions {
    const base = {
      password: env.SESSION_SECRET,
      cookieName: SESSION_COOKIE_NAME,
      cookieOptions: {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'lax' as const,
        path: '/',
      },
    };
    switch (lifetime) {
      case 'persistent':
        return { ...base, ttl: SESSION_REMEMBER_TTL_MS / 1000 };
      case 'challenge':
        return { ...base, ttl: TWO_FACTOR_CHALLENGE_TTL_MS / 1000 };
      case 'browser':
        // An explicit undefined maxAge makes iron-session emit a browser-session cookie.
        return { ...base, cookieOptions: { ...base.cookieOptions, maxAge: undefined } };
    }
  }
}
