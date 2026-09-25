import { Alert, Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = { title: 'Sign in' };

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const { next, reset } = await searchParams;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          No account yet?{' '}
          <Link href="/signup" className="underline underline-offset-4">
            Create one
          </Link>
        </CardDescription>
      </CardHeader>
      <div className="flex flex-col gap-4">
        {reset === '1' ? (
          <Alert tone="success">Password updated. Sign in with your new password.</Alert>
        ) : null}
        <LoginForm next={typeof next === 'string' ? next : undefined} />
      </div>
    </Card>
  );
}
