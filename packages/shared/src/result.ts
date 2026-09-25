/**
 * Minimal `Result` type used by actions to return expected failures as
 * values instead of throwing. Controllers translate a failed result into a
 * `DomainException`; the web layer translates it into UI state.
 */
export type Result<TValue, TError> =
  { readonly ok: true; readonly value: TValue } | { readonly ok: false; readonly error: TError };

export function ok<TValue>(value: TValue): { readonly ok: true; readonly value: TValue } {
  return { ok: true, value };
}

export function fail<TError>(error: TError): { readonly ok: false; readonly error: TError } {
  return { ok: false, error };
}
