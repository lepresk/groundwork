'use client';
/**
 * Two-step enrollment: generate a secret (QR code), confirm with a first
 * code, then show the recovery codes exactly once.
 */
import { TwoFactorCodeRequestSchema } from '@groundwork/shared';
import { Alert, Button, FormField } from '@groundwork/ui';
import { useState, useTransition } from 'react';
import { FormError } from '@/features/auth/components/form-error';
import { useActionForm } from '@/features/auth/use-action-form';
import { enableTwoFactorAction, startTwoFactorSetupAction, type TwoFactorSetup } from '../actions';

export function EnableTwoFactor() {
  const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
  const [recoveryCodes, setRecoveryCodes] = useState<readonly string[] | null>(null);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [starting, startTransition] = useTransition();

  const { form, submit, pending, formError } = useActionForm({
    schema: TwoFactorCodeRequestSchema,
    defaultValues: { code: '' },
    action: enableTwoFactorAction,
    onSuccess: (data) => {
      setRecoveryCodes(data.recoveryCodes);
    },
  });

  if (recoveryCodes !== null) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">Two-factor authentication is on.</Alert>
        <p className="text-sm">
          Store these recovery codes somewhere safe. Each one works once if you lose your device.
          They will not be shown again.
        </p>
        <ul className="grid grid-cols-2 gap-2 rounded-lg bg-muted p-4 font-mono text-sm">
          {recoveryCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (setup === null) {
    return (
      <div className="flex flex-col gap-4">
        <FormError message={setupError} />
        <Button
          pending={starting}
          onClick={() => {
            startTransition(async () => {
              const result = await startTwoFactorSetupAction();
              if (result.ok) {
                setSetup(result.data);
              } else {
                setSetupError(result.message);
              }
            });
          }}
        >
          Set up two-factor authentication
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <p className="text-sm">
        Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
      </p>
      {/* eslint-disable-next-line @next/next/no-img-element -- data URL generated server-side */}
      <img
        src={setup.qrCodeDataUrl}
        alt="QR code for your authenticator app"
        width={200}
        height={200}
      />
      <p className="text-xs text-muted-foreground">
        Cannot scan? Enter this key manually: <code className="font-mono">{setup.secret}</code>
      </p>
      <FormError message={formError} />
      <FormField
        label="Authentication code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        error={form.formState.errors.code?.message}
        {...form.register('code')}
      />
      <Button type="submit" pending={pending}>
        Turn on
      </Button>
    </form>
  );
}
