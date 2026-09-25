import type { ComponentProps } from 'react';
import { cn } from '../cn';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-(--radius-control) border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring aria-invalid:border-danger',
        className,
      )}
      {...props}
    />
  );
}
