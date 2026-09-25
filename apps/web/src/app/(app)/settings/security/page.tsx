import { Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import { DisableTwoFactor } from '@/features/account/components/disable-two-factor';
import { EnableTwoFactor } from '@/features/account/components/enable-two-factor';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Security' };

export default async function SecurityPage() {
  const user = await requireUser();
  return (
    <Card className="max-w-xl">
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>
          {user.twoFactorEnabled
            ? 'Your account asks for a code from your authenticator app at sign-in.'
            : 'Add a second step at sign-in with an authenticator app.'}
        </CardDescription>
      </CardHeader>
      {user.twoFactorEnabled ? <DisableTwoFactor /> : <EnableTwoFactor />}
    </Card>
  );
}
