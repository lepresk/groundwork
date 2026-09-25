/**
 * Root layout: global styles, document language, and default metadata.
 */
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Groundwork', template: '%s | Groundwork' },
  description: 'NestJS + Next.js monorepo starter.',
};

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
