/**
 * Producer for the email queue. Payloads are validated against the shared
 * contract before they leave the process; delivery happens in apps/worker.
 *
 * Call `enqueue` from inside `registerAfterCommitHook` when the email
 * depends on data written in the current transaction.
 */
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { EMAIL_JOB_NAME, EmailJobSchema, QUEUE_NAMES, type EmailJob } from '@groundwork/shared';
import { Queue } from 'bullmq';

const EMAIL_JOB_ATTEMPTS = 5;
const EMAIL_JOB_BACKOFF_MS = 10_000;

@Injectable()
export class EmailQueue {
  constructor(@InjectQueue(QUEUE_NAMES.email) private readonly queue: Queue) {}

  async enqueue(job: EmailJob): Promise<void> {
    await this.queue.add(EMAIL_JOB_NAME, EmailJobSchema.parse(job), {
      attempts: EMAIL_JOB_ATTEMPTS,
      backoff: { type: 'exponential', delay: EMAIL_JOB_BACKOFF_MS },
      removeOnComplete: { count: 1000 },
      removeOnFail: { age: 7 * 24 * 3600 },
    });
  }
}
