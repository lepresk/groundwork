'use client';
/**
 * Disabling requires the password and a current code, with an explicit
 * confirmation step because it lowers the account's protection.
 */
import { TwoFactorDisableRequestSchema } from '@groundwork/shared';
import { Button, FormField } from '@groundwork/ui';
import { useState } from 'react';
import { FormError } from '@/features/auth/components/form-error';
import { useActionForm } from '@/features/auth/use-action-form';
import { disableTwoFactorAction } from '../actions';

export function DisableTwoFactor() {
  const [confirming, setConfirming] = useState(false);
  const { form, submit, pending, formError } = useActionForm({
    schema: TwoFactorDisableRequestSchema,
    defaultValues: { password: '', code: '' },
    action: disableTwoFactorAction,
  });
  const { errors } = form.formState;

  if (!confirming) {
    return (
      <Button
        variant="danger"
        onClick={() => {
          setConfirming(true);
        }}
      >
        Turn off two-factor authentication
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm">
        Your account will only be protected by your password. Confirm with your password and a
        current code.
      </p>
      <FormError message={formError} />
      <FormField
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <FormField
        label="Authentication code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        error={errors.code?.message}
        {...form.register('code')}
      />
      <div className="flex gap-2">
        <Button type="submit" variant="danger" pending={pending}>
          Turn off
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => {
            setConfirming(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
