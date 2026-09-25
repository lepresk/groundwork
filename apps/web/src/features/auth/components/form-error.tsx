import { Alert } from '@groundwork/ui';

export function FormError({ message }: { readonly message: string | null }) {
  return message === null ? null : <Alert tone="danger">{message}</Alert>;
}
