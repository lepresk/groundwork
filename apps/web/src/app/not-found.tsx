import { Button, Card, CardDescription, CardHeader, CardTitle } from '@groundwork/ui';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Page not found</CardTitle>
          <CardDescription>
            The page you are looking for does not exist or has moved.
          </CardDescription>
        </CardHeader>
        <Button asChild variant="secondary">
          <Link href="/">Back to the app</Link>
        </Button>
      </Card>
    </main>
  );
}
