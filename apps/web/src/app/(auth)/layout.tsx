/**
 * Layout of the public authentication pages: a centered, narrow column.
 */
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { readonly children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-4 py-12">
      {children}
    </main>
  );
}
