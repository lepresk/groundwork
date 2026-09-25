/**
 * Result shape returned by every Server Action to its form: either success
 * (with optional data) or a user-facing message plus per-field errors.
 */
import type { ApiFailure } from './api/call';
import { errorMessage } from './errors';

export interface ActionFailure {
  readonly ok: false;
  readonly message: string;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export type ActionResult<T = null> = { readonly ok: true; readonly data: T } | ActionFailure;

export function actionFailure(failure: Pick<ApiFailure, 'code' | 'fieldErrors'>): ActionFailure {
  return { ok: false, message: errorMessage(failure.code), fieldErrors: failure.fieldErrors };
}

export function invalidInput(fieldErrors: Record<string, string> = {}): ActionFailure {
  return { ok: false, message: errorMessage('generic.validation_failed'), fieldErrors };
}
