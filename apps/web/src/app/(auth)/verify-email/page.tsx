/**
 * Landing page of the confirmation link. Consumes the token server-side and
 * shows the outcome, with a resend form on failure.
 */
import { Alert, Button, Card, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ResendVerificationForm } from '@/features/auth/components/resend-verification-form';
import { verifyEmailToken } from '@/features/auth/verify-email';

export const metadata: Metadata = { title: 'Confirm your email' };

export default async function VerifyEmailPage({ searchParams }: PageProps<'/verify-email'>) {
  const { token } = await searchParams;
  const result =
    typeof token === 'string'
      ? await verifyEmailToken(token)
      : ({ ok: false, message: 'This confirmation link is incomplete.' } as const);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{result.ok ? 'Email confirmed' : 'Confirmation failed'}</CardTitle>
      </CardHeader>
      {result.ok ? (
        <div className="flex flex-col gap-4">
          <Alert tone="success">Your email address is confirmed. You can now sign in.</Alert>
          <Button asChild>
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Alert tone="danger">{result.message}</Alert>
          <ResendVerificationForm />
        </div>
      )}
    </Card>
  );
}
