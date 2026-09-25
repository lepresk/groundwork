/**
 * Email job contract: valid payloads and template/data mismatches.
 */
import { describe, expect, it } from 'vitest';
import { EmailJobSchema } from '../src/queues.js';

describe('EmailJobSchema', () => {
  it('accepts a well-formed verification job', () => {
    const result = EmailJobSchema.safeParse({
      template: 'verify_email',
      to: 'ada@example.com',
      data: { firstName: 'Ada', verificationUrl: 'http://localhost:3000/verify-email?token=x' },
    });

    expect(result.success).toBe(true);
  });

  it('rejects data that belongs to another template', () => {
    const result = EmailJobSchema.safeParse({
      template: 'reset_password',
      to: 'ada@example.com',
      data: { firstName: 'Ada', verificationUrl: 'http://localhost:3000' },
    });

    expect(result.success).toBe(false);
  });
});
