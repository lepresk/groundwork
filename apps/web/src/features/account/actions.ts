'use server';
/**
 * Server Actions for account security (two-factor management).
 */
import {
  TwoFactorCodeRequestSchema,
  TwoFactorDisableRequestSchema,
  TwoFactorEnableResponseSchema,
  TwoFactorSetupResponseSchema,
} from '@groundwork/shared';
import { revalidatePath } from 'next/cache';
import QRCode from 'qrcode';
import { actionFailure, invalidInput, type ActionResult } from '@/lib/action-result';
import { callApi } from '@/lib/api/call';
import { fieldErrorsFromZod } from '@/lib/validation';

export interface TwoFactorSetup {
  readonly secret: string;
  readonly qrCodeDataUrl: string;
}

export async function startTwoFactorSetupAction(): Promise<ActionResult<TwoFactorSetup>> {
  const result = await callApi('/auth/two-factor/setup', {
    method: 'POST',
    schema: TwoFactorSetupResponseSchema,
  });
  if (!result.ok) {
    return actionFailure(result);
  }
  const qrCodeDataUrl = await QRCode.toDataURL(result.data.otpauthUrl, { margin: 1, width: 200 });
  return { ok: true, data: { secret: result.data.secret, qrCodeDataUrl } };
}

export async function enableTwoFactorAction(
  input: unknown,
): Promise<ActionResult<{ recoveryCodes: string[] }>> {
  const parsed = TwoFactorCodeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(fieldErrorsFromZod(parsed.error));
  }
  const result = await callApi('/auth/two-factor/enable', {
    method: 'POST',
    body: parsed.data,
    schema: TwoFactorEnableResponseSchema,
  });
  if (!result.ok) {
    return actionFailure(result);
  }
  revalidatePath('/settings/security');
  return { ok: true, data: result.data };
}

export async function disableTwoFactorAction(input: unknown): Promise<ActionResult> {
  const parsed = TwoFactorDisableRequestSchema.safeParse(input);
  if (!parsed.success) {
    return invalidInput(fieldErrorsFromZod(parsed.error));
  }
  const result = await callApi('/auth/two-factor/disable', { method: 'POST', body: parsed.data });
  if (!result.ok) {
    return actionFailure(result);
  }
  revalidatePath('/settings/security');
  return { ok: true, data: null };
}
