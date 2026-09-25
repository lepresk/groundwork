import { Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ForgotPasswordForm } from '@/features/auth/components/forgot-password-form';

export const metadata: Metadata = { title: 'Reset your password' };

export default function ForgotPasswordPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we will send you a reset link.{' '}
          <Link href="/login" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </CardDescription>
      </CardHeader>
      <ForgotPasswordForm />
    </Card>
  );
}
