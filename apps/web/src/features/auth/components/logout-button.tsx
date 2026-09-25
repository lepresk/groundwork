'use client';

import { Button } from '@groundwork/ui';
import { useTransition } from 'react';
import { logoutAction } from '../actions';

export function LogoutButton() {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="secondary"
      size="sm"
      pending={pending}
      onClick={() => {
        startTransition(logoutAction);
      }}
    >
      Sign out
    </Button>
  );
}
