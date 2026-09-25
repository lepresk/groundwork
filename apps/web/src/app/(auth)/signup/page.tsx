/**
 * Account creation page. Links back to sign-in for existing users.
 */
import { Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SignupForm } from '@/features/auth/components/signup-form';

export const metadata: Metadata = { title: 'Create an account' };

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create an account</CardTitle>
        <CardDescription>
          Already registered?{' '}
          <Link href="/login" className="underline underline-offset-4">
            Sign in
          </Link>
        </CardDescription>
      </CardHeader>
      <SignupForm />
    </Card>
  );
}
