/**
 * Resolves the originating client of a request. Behind the web BFF every
 * request comes from the Next.js server, which forwards the real client IP
 * and user agent in dedicated headers. Those headers are only trusted when
 * `TRUST_CLIENT_IP_HEADER` is enabled, i.e. when the API is not publicly
 * reachable.
 */
import type { Request } from 'express';
import { env } from '../../config/env.js';

export const CLIENT_IP_HEADER = 'x-client-ip';
export const CLIENT_USER_AGENT_HEADER = 'x-client-user-agent';

export interface ClientContext {
  readonly ipAddress: string | null;
  readonly userAgent: string | null;
}

function headerValue(request: Request, name: string): string | null {
  const value = request.headers[name];
  const first = Array.isArray(value) ? value[0] : value;
  return first !== undefined && first !== '' ? first : null;
}

export function resolveClientContext(request: Request): ClientContext {
  if (env.TRUST_CLIENT_IP_HEADER) {
    return {
      ipAddress: headerValue(request, CLIENT_IP_HEADER) ?? request.ip ?? null,
      userAgent:
        headerValue(request, CLIENT_USER_AGENT_HEADER) ?? headerValue(request, 'user-agent'),
    };
  }
  return { ipAddress: request.ip ?? null, userAgent: headerValue(request, 'user-agent') };
}
