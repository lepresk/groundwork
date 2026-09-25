/**
 * Current user resolution for Server Components. Deduplicated per request
 * with React `cache`, so layouts and pages can all call it freely.
 */
import 'server-only';
import { UserProfileSchema, type UserProfile } from '@groundwork/shared';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { callApi } from './api/call';

export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const result = await callApi('/auth/me', { schema: UserProfileSchema });
  return result.ok ? result.data : null;
});

/** Redirects to the login page when there is no valid session. */
export async function requireUser(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (user === null) {
    redirect('/login');
  }
  return user;
}
