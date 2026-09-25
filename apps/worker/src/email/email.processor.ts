/**
 * Consumes the email queue. Payloads are re-validated against the shared
 * contract: a malformed job fails permanently (no retry), while transport
 * errors are rethrown so BullMQ retries with the producer's backoff.
 */
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { EmailJobSchema, QUEUE_NAMES } from '@groundwork/shared';
import { type Job, UnrecoverableError } from 'bullmq';
import { env } from '../config/env.js';
import { MAIL_TRANSPORT, type MailTransport } from '../mail/mail-transport.js';
import { renderEmail } from '../mail/templates/render-email.js';

@Processor(QUEUE_NAMES.email, { concurrency: env.WORKER_CONCURRENCY })
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(@Inject(MAIL_TRANSPORT) private readonly transport: MailTransport) {
    super();
  }

  async process(job: Job): Promise<void> {
    const parsed = EmailJobSchema.safeParse(job.data);
    if (!parsed.success) {
      throw new UnrecoverableError(`Invalid email job payload: ${parsed.error.message}`);
    }

    await this.transport.send({ to: parsed.data.to, ...renderEmail(parsed.data) });
    this.logger.log({ jobId: job.id, template: parsed.data.template }, 'Email sent');
  }
}
