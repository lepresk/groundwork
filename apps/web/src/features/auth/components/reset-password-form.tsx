'use client';

import { PASSWORD_MIN_LENGTH, ResetPasswordRequestSchema } from '@groundwork/shared';
import { Button, FormField } from '@groundwork/ui';
import { resetPasswordAction } from '../actions';
import { useActionForm } from '../use-action-form';
import { FormError } from './form-error';

export function ResetPasswordForm({ token }: { readonly token: string }) {
  const { form, submit, pending, formError } = useActionForm({
    schema: ResetPasswordRequestSchema,
    defaultValues: { token, password: '' },
    action: resetPasswordAction,
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <FormError message={formError} />
      <input type="hidden" {...form.register('token')} />
      <FormField
        label="New password"
        type="password"
        autoComplete="new-password"
        hint={`At least ${String(PASSWORD_MIN_LENGTH)} characters. Every other session will be signed out.`}
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      <Button type="submit" pending={pending}>
        Set new password
      </Button>
    </form>
  );
}
