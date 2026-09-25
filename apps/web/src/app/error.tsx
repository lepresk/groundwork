'use client';

import { Button, Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';

export default function ErrorPage({
  reset,
}: {
  readonly error: Error;
  readonly reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>An unexpected error occurred. Try again in a moment.</CardDescription>
        </CardHeader>
        <Button onClick={reset}>Try again</Button>
      </Card>
    </main>
  );
}
