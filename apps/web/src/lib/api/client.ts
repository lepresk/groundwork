/**
 * The BFF client. Forwards the session cookie plus the real client IP and
 * user agent to the API, which uses them for rate limiting and session
 * records. Import only from Server Components and Server Actions.
 */
import 'server-only';
import { createApiFetch, type ApiFetchResult } from '@lepresk/next-bff-fetch';
import { SESSION_COOKIE_NAME } from '@groundwork/shared';
import { headers } from 'next/headers';
import { connection } from 'next/server';
import { serverEnv } from '../env';

/** Extra headers describing the real client, read from the incoming request. */
export async function buildForwardHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const forwarded: Record<string, string> = {};
  const ip = incoming.get('x-forwarded-for')?.split(',')[0]?.trim() ?? incoming.get('x-real-ip');
  if (ip) {
    forwarded['x-client-ip'] = ip;
  }
  const userAgent = incoming.get('user-agent');
  if (userAgent !== null) {
    forwarded['x-client-user-agent'] = userAgent;
  }
  return forwarded;
}

let fetcher: ReturnType<typeof createApiFetch> | undefined;

/**
 * Calls the API. Every call is request-time: `connection()` opts the caller
 * out of prerendering, and the client is created on first use so
 * configuration is read at runtime, not at build time.
 */
export async function apiFetch(path: string, init?: RequestInit): Promise<ApiFetchResult> {
  await connection();
  fetcher ??= createApiFetch({
    apiInternalUrl: serverEnv().API_INTERNAL_URL,
    sessionCookieName: SESSION_COOKIE_NAME,
    upstreamUnavailableBody: {
      code: 'generic.upstream_unavailable',
      message: 'The service is temporarily unavailable.',
    },
    buildForwardHeaders,
  });
  return fetcher(path, init);
}
