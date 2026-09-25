/**
 * Entry route: sends signed-in users to the dashboard, others to login.
 */
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/session';

export default async function HomePage() {
  const user = await getCurrentUser();
  redirect(user === null ? '/login' : '/dashboard');
}
