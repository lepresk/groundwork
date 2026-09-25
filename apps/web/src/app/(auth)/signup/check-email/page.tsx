/**
 * Shown after signup: explains the confirmation email and offers a resend.
 */
import { Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import { ResendVerificationForm } from '@/features/auth/components/resend-verification-form';

export const metadata: Metadata = { title: 'Check your inbox' };

export default function CheckEmailPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Check your inbox</CardTitle>
        <CardDescription>
          We sent a confirmation link to your email address. It expires in 24 hours. Did not receive
          it? Request a new one below.
        </CardDescription>
      </CardHeader>
      <ResendVerificationForm />
    </Card>
  );
}
