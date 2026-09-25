/**
 * Card container and its header, title, and description parts.
 */
import type { ComponentProps } from 'react';
import { cn } from '../cn';

export function Card({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-background p-6 shadow-sm', className)}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: ComponentProps<'header'>) {
  return <header className={cn('mb-6 flex flex-col gap-1.5', className)} {...props} />;
}

export function CardTitle({ className, ...props }: ComponentProps<'h1'>) {
  return <h1 className={cn('text-xl font-semibold tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }: ComponentProps<'p'>) {
  return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}
