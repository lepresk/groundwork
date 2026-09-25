/**
 * Inline message with a tone. Danger alerts use `role="alert"` (announced
 * immediately); others use `role="status"`.
 */
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '../cn';

const alertVariants = cva('rounded-(--radius-control) border px-4 py-3 text-sm', {
  variants: {
    tone: {
      info: 'border-border bg-muted',
      success: 'border-success/40 bg-success/10',
      danger: 'border-danger/40 bg-danger/10 text-danger',
    },
  },
  defaultVariants: { tone: 'info' },
});

export interface AlertProps extends ComponentProps<'div'>, VariantProps<typeof alertVariants> {}

export function Alert({ className, tone, ...props }: AlertProps) {
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(alertVariants({ tone }), className)}
      {...props}
    />
  );
}
