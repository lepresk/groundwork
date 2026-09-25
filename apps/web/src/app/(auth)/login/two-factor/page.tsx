import { Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import { TwoFactorLoginForm } from '@/features/auth/components/two-factor-login-form';

export const metadata: Metadata = { title: 'Two-factor authentication' };

export default async function TwoFactorLoginPage({ searchParams }: PageProps<'/login/two-factor'>) {
  const { next } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>Enter the 6-digit code from your authenticator app.</CardDescription>
      </CardHeader>
      <TwoFactorLoginForm next={typeof next === 'string' ? next : undefined} />
    </Card>
  );
}
