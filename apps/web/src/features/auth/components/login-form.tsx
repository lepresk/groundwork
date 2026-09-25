'use client';
/**
 * Sign-in form (email, password, remember me). Submits to `loginAction`,
 * which redirects on success.
 */
import { LoginRequestSchema } from '@groundwork/shared';
import { Button, FormField } from '@groundwork/ui';
import Link from 'next/link';
import { loginAction } from '../actions';
import { useActionForm } from '../use-action-form';
import { FormError } from './form-error';

export function LoginForm({ next }: { readonly next?: string | undefined }) {
  const { form, submit, pending, formError } = useActionForm({
    schema: LoginRequestSchema,
    defaultValues: { email: '', password: '', rememberMe: false },
    action: (values) => loginAction(values, next),
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <FormError message={formError} />
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
        autoComplete="current-password"
        error={errors.password?.message}
        {...form.register('password')}
      />
      <div className="flex items-center justify-between text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" {...form.register('rememberMe')} />
          Keep me signed in
        </label>
        <Link href="/forgot-password" className="underline underline-offset-4">
          Forgot password?
        </Link>
      </div>
      <Button type="submit" pending={pending}>
        Sign in
      </Button>
    </form>
  );
}
