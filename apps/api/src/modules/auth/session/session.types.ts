/**
 * Shapes carried by the sealed session cookie and attached to requests.
 */
import type { Request } from 'express';

export interface TwoFactorChallenge {
  readonly userId: string;
  readonly rememberMe: boolean;
  readonly expiresAt: number;
}

/** Content of the iron-session cookie. It never holds more than identifiers. */
export interface SessionCookieData {
  sessionId?: string;
  userId?: string;
  twoFactorChallenge?: TwoFactorChallenge;
}

export interface AuthenticatedSession {
  readonly sessionId: string;
  readonly userId: string;
}

export interface AuthenticatedRequest extends Request {
  auth?: AuthenticatedSession;
}
