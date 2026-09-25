/**
 * Form-level error banner. Renders nothing when there is no error.
 */
import { Alert } from '@groundwork/ui';

export function FormError({ message }: { readonly message: string | null }) {
  return message === null ? null : <Alert tone="danger">{message}</Alert>;
}
