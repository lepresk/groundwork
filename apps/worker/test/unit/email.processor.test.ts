/**
 * Email processor: valid jobs are sent, malformed payloads fail without
 * retry, transport errors are rethrown for retry.
 */
import { UnrecoverableError, type Job } from 'bullmq';
import { describe, expect, it, vi } from 'vitest';
import { EmailProcessor } from '../../src/email/email.processor.js';
import type { MailTransport } from '../../src/mail/mail-transport.js';

function job(data: unknown): Job {
  return { id: '1', data } as Job;
}

const VALID_JOB = {
  template: 'reset_password',
  to: 'ada@example.com',
  data: { firstName: 'Ada', resetUrl: 'http://localhost:3000/reset-password?token=t' },
};

describe('EmailProcessor', () => {
  it('renders and sends a valid job', async () => {
    const transport: MailTransport = { send: vi.fn().mockResolvedValue(undefined) };

    await new EmailProcessor(transport).process(job(VALID_JOB));

    expect(transport.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'ada@example.com', subject: 'Reset your password' }),
    );
  });

  it('fails permanently on a malformed payload so it is not retried', async () => {
    const transport: MailTransport = { send: vi.fn() };

    await expect(
      new EmailProcessor(transport).process(job({ template: 'unknown' })),
    ).rejects.toBeInstanceOf(UnrecoverableError);
    expect(transport.send).not.toHaveBeenCalled();
  });

  it('rethrows transport errors so BullMQ retries the job', async () => {
    const failure = new Error('SMTP timeout');
    const transport: MailTransport = { send: vi.fn().mockRejectedValue(failure) };

    await expect(new EmailProcessor(transport).process(job(VALID_JOB))).rejects.toBe(failure);
  });
});
