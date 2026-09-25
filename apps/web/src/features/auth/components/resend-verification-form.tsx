'use client';
/**
 * Requests a new confirmation link. The confirmation never reveals whether
 * the account exists.
 */
import { EmailRequestSchema } from '@groundwork/shared';
import { Alert, Button, FormField } from '@groundwork/ui';
import { useState } from 'react';
import { resendVerificationAction } from '../actions';
import { useActionForm } from '../use-action-form';
import { FormError } from './form-error';

export function ResendVerificationForm() {
  const [sent, setSent] = useState(false);
  const { form, submit, pending, formError } = useActionForm({
    schema: EmailRequestSchema,
    defaultValues: { email: '' },
    action: resendVerificationAction,
    onSuccess: () => {
      setSent(true);
    },
  });

  if (sent) {
    return (
      <Alert tone="success">
        If this account still needs confirmation, a new link is on its way.
      </Alert>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <FormError message={formError} />
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />
      <Button type="submit" variant="secondary" pending={pending}>
        Send a new link
      </Button>
    </form>
  );
}
