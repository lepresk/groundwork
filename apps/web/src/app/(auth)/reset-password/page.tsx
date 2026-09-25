/**
 * Landing page of the reset link: new password form, or a way to request a
 * new link when the token is missing.
 */
import { Alert, Button, Card, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form';

export const metadata: Metadata = { title: 'Choose a new password' };

export default async function ResetPasswordPage({ searchParams }: PageProps<'/reset-password'>) {
  const { token } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Choose a new password</CardTitle>
      </CardHeader>
      {typeof token === 'string' ? (
        <ResetPasswordForm token={token} />
      ) : (
        <div className="flex flex-col gap-4">
          <Alert tone="danger">This reset link is incomplete. Request a new one.</Alert>
          <Button asChild variant="secondary">
            <Link href="/forgot-password">Request a new link</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
