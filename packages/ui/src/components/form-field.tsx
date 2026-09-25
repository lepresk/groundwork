/**
 * Label, control, and error message wired together for accessibility:
 * the error is announced and referenced by `aria-describedby`.
 */
import { useId, type ReactElement } from 'react';
import { Input } from './input';
import { Label } from './label';
import type { ComponentProps } from 'react';

export interface FormFieldProps extends Omit<ComponentProps<'input'>, 'id'> {
  readonly label: string;
  readonly error?: string | undefined;
  readonly hint?: string;
}

export function FormField({ label, error, hint, ...inputProps }: FormFieldProps): ReactElement {
  const id = useId();
  const descriptionId = `${id}-description`;
  const hasDescription = error !== undefined || hint !== undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={hasDescription ? descriptionId : undefined}
        {...inputProps}
      />
      {error === undefined ? (
        hint === undefined ? null : (
          <p id={descriptionId} className="text-xs text-muted-foreground">
            {hint}
          </p>
        )
      ) : (
        <p id={descriptionId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
