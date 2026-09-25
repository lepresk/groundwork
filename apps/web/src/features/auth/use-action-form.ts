'use client';
/**
 * Binds a react-hook-form instance to a Server Action: client-side Zod
 * validation on blur, pending state while the action runs, server field
 * errors mapped back onto inputs, and a form-level error message.
 *
 * The same shared schema validates in the browser (for fast feedback) and
 * again in the Server Action (for trust).
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useTransition, type BaseSyntheticEvent } from 'react';
import {
  useForm,
  type DefaultValues,
  type FieldValues,
  type Path,
  type UseFormReturn,
} from 'react-hook-form';
import type { z } from 'zod';
import type { ActionResult } from '@/lib/action-result';

interface UseActionFormOptions<TInput extends FieldValues, TOutput extends FieldValues, TData> {
  readonly schema: z.ZodType<TOutput, TInput>;
  readonly defaultValues: DefaultValues<TInput>;
  readonly action: (values: TOutput) => Promise<ActionResult<TData>>;
  readonly onSuccess?: (data: TData) => void;
}

export interface ActionForm<TInput extends FieldValues, TOutput extends FieldValues> {
  readonly form: UseFormReturn<TInput, unknown, TOutput>;
  readonly submit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly pending: boolean;
  readonly formError: string | null;
}

export function useActionForm<
  TInput extends FieldValues,
  TOutput extends FieldValues,
  TData = null,
>({
  schema,
  defaultValues,
  action,
  onSuccess,
}: UseActionFormOptions<TInput, TOutput, TData>): ActionForm<TInput, TOutput> {
  const form = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: 'onBlur',
  });
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const submit = form.handleSubmit((values) => {
    setFormError(null);
    startTransition(async () => {
      const result = await action(values);
      if (result.ok) {
        onSuccess?.(result.data);
        return;
      }
      for (const [field, message] of Object.entries(result.fieldErrors)) {
        form.setError(field as Path<TInput>, { message });
      }
      setFormError(result.message);
    });
  });

  return { form, submit, pending, formError };
}
