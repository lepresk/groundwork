/**
 * Accepts only same-origin relative paths as post-login destinations,
 * so a crafted `?next=` cannot turn the login page into an open redirect.
 */
const FALLBACK = '/dashboard';

export function safeRedirectPath(candidate: unknown): string {
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) {
    return FALLBACK;
  }
  if (candidate.includes('\\') || candidate.includes('://')) {
    return FALLBACK;
  }
  return candidate;
}
