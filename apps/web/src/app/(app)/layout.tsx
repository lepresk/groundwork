/**
 * Layout of the signed-in area. `requireUser()` is the real access check
 * (the proxy only checks cookie presence) and provides the header identity.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { LogoutButton } from '@/features/auth/components/logout-button';
import { requireUser } from '@/lib/session';

export default async function AppLayout({ children }: { readonly children: ReactNode }) {
  const user = await requireUser();
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6 text-sm">
            <Link href="/dashboard" className="font-semibold">
              Groundwork
            </Link>
            <Link href="/settings/security" className="text-muted-foreground hover:text-foreground">
              Security
            </Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{user.email}</span>
            <LogoutButton />
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">{children}</main>
    </div>
  );
}
