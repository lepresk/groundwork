/**
 * Consumes a verification token server-side when the user opens the link.
 */
import 'server-only';
import type { ActionResult } from '@/lib/action-result';
import { actionFailure } from '@/lib/action-result';
import { callApi } from '@/lib/api/call';

export async function verifyEmailToken(token: string): Promise<ActionResult> {
  const result = await callApi('/auth/email/verify', { method: 'POST', body: { token } });
  return result.ok ? { ok: true, data: null } : actionFailure(result);
}
