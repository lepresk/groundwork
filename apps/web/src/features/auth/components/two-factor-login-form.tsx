'use client';
/**
 * Second sign-in step: an authenticator code, or a recovery code as a
 * fallback. The inactive field is unregistered so only one is sent.
 */
import { TwoFactorLoginRequestSchema } from '@groundwork/shared';
import { Button, FormField } from '@groundwork/ui';
import { useState } from 'react';
import { completeTwoFactorLoginAction } from '../actions';
import { useActionForm } from '../use-action-form';
import { FormError } from './form-error';

export function TwoFactorLoginForm({ next }: { readonly next?: string | undefined }) {
  const [useRecoveryCode, setUseRecoveryCode] = useState(false);
  const { form, submit, pending, formError } = useActionForm({
    schema: TwoFactorLoginRequestSchema,
    defaultValues: {},
    action: (values) => completeTwoFactorLoginAction(values, next),
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <FormError message={formError} />
      {useRecoveryCode ? (
        <FormField
          key="recoveryCode"
          label="Recovery code"
          autoComplete="off"
          error={errors.recoveryCode?.message}
          {...form.register('recoveryCode', { shouldUnregister: true })}
        />
      ) : (
        <FormField
          key="code"
          label="Authentication code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          error={errors.code?.message}
          {...form.register('code', { shouldUnregister: true })}
        />
      )}
      <Button type="submit" pending={pending}>
        Verify
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={() => {
          setUseRecoveryCode((current) => !current);
        }}
      >
        {useRecoveryCode ? 'Use the authenticator app instead' : 'Use a recovery code instead'}
      </Button>
    </form>
  );
}
