/**
 * Button with variants and a built-in pending state. While `pending`, the
 * button is disabled and shows a spinner, so double submits are impossible.
 */
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../cn';
import { Spinner } from './spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-(--radius-control) text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-60',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:opacity-90',
        secondary: 'border border-border bg-background hover:bg-muted',
        danger: 'bg-danger text-danger-foreground hover:opacity-90',
        ghost: 'hover:bg-muted',
      },
      size: {
        md: 'h-10 px-4',
        sm: 'h-8 px-3',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps extends ComponentProps<'button'>, VariantProps<typeof buttonVariants> {
  readonly asChild?: boolean;
  readonly pending?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  pending = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  if (asChild) {
    return <Slot className={cn(buttonVariants({ variant, size }), className)}>{children}</Slot>;
  }
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled === true || pending}
      aria-busy={pending}
      {...props}
    >
      {pending ? <Spinner /> : null}
      {children}
    </button>
  );
}
