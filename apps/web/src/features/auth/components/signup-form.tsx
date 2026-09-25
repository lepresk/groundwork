'use client';
/**
 * Account creation form. Submits to `signupAction`, which redirects to the
 * check-email page on success.
 */
import { PASSWORD_MIN_LENGTH, SignupRequestSchema } from '@groundwork/shared';
import { Button, FormField } from '@groundwork/ui';
import { signupAction } from '../actions';
import { useActionForm } from '../use-action-form';
import { FormError } from './form-error';

export function SignupForm() {
  const { form, submit, pending, formError } = useActionForm({
    schema: SignupRequestSchema,
    defaultValues: { email: '', password: '', firstName: '', lastName: '' },
    action: signupAction,
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <FormError message={formError} />
      <div className="grid grid-cols-2 gap-4">
        <FormField
          label="First name"
          autoComplete="given-name"
          error={errors.firstName?.message}
          {...form.register('firstName')}
        />
        <FormField
          label="Last name"
          autoComplete="family-name"
          error={errors.lastName?.message}
          {...form.register('lastName')}
        />
      </div>
      <FormField
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...form.register('email')}
      />
      <FormField
        label="Password"
        type="password"
        autoComplete="new-password"
        hint={`At least ${String(PASSWORD_MIN_LENGTH)} characters.`}
        error={errors.password?.message}
        {...form.register('password')}
      />
      <Button type="submit" pending={pending}>
        Create account
      </Button>
    </form>
  );
}
