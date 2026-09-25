/**
 * UI primitives: pending buttons, accessible form fields, alert roles,
 * cards, and class merging.
 */
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  Alert,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  FormField,
  cn,
} from '../src/index';

describe('Button', () => {
  it('disables itself and shows a spinner while pending', () => {
    render(<Button pending>Save</Button>);

    const button = screen.getByRole('button', { name: /save/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('renders its child element when asChild is set', () => {
    render(
      <Button asChild variant="secondary">
        <a href="/x">Go</a>
      </Button>,
    );

    expect(screen.getByRole('link', { name: 'Go' })).toHaveClass('border');
  });
});

describe('FormField', () => {
  it('links the input to its error message and marks it invalid', () => {
    render(<FormField label="Email" error="Enter a valid email" />);

    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('Enter a valid email');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
  });

  it('shows the hint when there is no error', () => {
    render(<FormField label="Password" hint="At least 12 characters" />);

    expect(screen.getByLabelText('Password')).toHaveAccessibleDescription('At least 12 characters');
  });

  it('renders no description when neither error nor hint is given', () => {
    render(<FormField label="Name" />);

    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-describedby');
  });
});

describe('Alert', () => {
  it('announces danger alerts assertively and others politely', () => {
    render(
      <>
        <Alert tone="danger">Failed</Alert>
        <Alert tone="success">Saved</Alert>
      </>,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Failed');
    expect(screen.getByRole('status')).toHaveTextContent('Saved');
  });
});

describe('Card', () => {
  it('renders a titled section', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>Welcome back</CardDescription>
        </CardHeader>
      </Card>,
    );

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
  });
});

describe('cn', () => {
  it('lets later Tailwind utilities override earlier ones', () => {
    expect(cn('px-2 text-sm', undefined, 'px-4')).toBe('text-sm px-4');
  });
});
