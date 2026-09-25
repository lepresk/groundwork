'use client';

import { EmailRequestSchema } from '@groundwork/shared';
import { Alert, Button, FormField } from '@groundwork/ui';
import { useState } from 'react';
import { forgotPasswordAction } from '../actions';
import { useActionForm } from '../use-action-form';
import { FormError } from './form-error';

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);
  const { form, submit, pending, formError } = useActionForm({
    schema: EmailRequestSchema,
    defaultValues: { email: '' },
    action: forgotPasswordAction,
    onSuccess: () => {
      setSent(true);
    },
  });

  if (sent) {
    return (
      <Alert tone="success">
        If an account exists for this email, a reset link is on its way. It expires in 1 hour.
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
      <Button type="submit" pending={pending}>
        Send reset link
      </Button>
    </form>
  );
}
