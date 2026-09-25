/**
 * Dashboard placeholder: the starting point for the first product feature.
 */
import { Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';
import type { Metadata } from 'next';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Welcome, {user.firstName}</CardTitle>
        <CardDescription>
          This is your starting point. Generate your first feature with{' '}
          <code className="font-mono">pnpm gen module &lt;name&gt;</code>.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
