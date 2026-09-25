/**
 * End-to-end through Redis: a job added to the real queue is picked up by
 * the real BullMQ worker and delivered through the (recorded) transport.
 */
import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplicationContext } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { EMAIL_JOB_NAME, QUEUE_NAMES } from '@groundwork/shared';
import type { Queue } from 'bullmq';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { MAIL_TRANSPORT, type MailMessage } from '../../src/mail/mail-transport.js';
import { startHealthServer } from '../../src/health/health-server.js';
import { WorkerModule } from '../../src/worker.module.js';

describe('email queue (Redis)', () => {
  let app: INestApplicationContext;
  const sent: MailMessage[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [WorkerModule] })
      .overrideProvider(MAIL_TRANSPORT)
      .useValue({ send: (message: MailMessage) => Promise.resolve(void sent.push(message)) })
      .compile();
    app = await moduleRef.init();
  });

  afterAll(async () => {
    await app.get<Queue>(getQueueToken(QUEUE_NAMES.email)).obliterate({ force: true });
    await app.close();
  });

  it('delivers an enqueued email job', async () => {
    const queue = app.get<Queue>(getQueueToken(QUEUE_NAMES.email));

    await queue.add(EMAIL_JOB_NAME, {
      template: 'verify_email',
      to: 'ada@example.com',
      data: { firstName: 'Ada', verificationUrl: 'http://localhost:3000/verify-email?token=t' },
    });

    await vi.waitFor(
      () => {
        expect(sent).toEqual([expect.objectContaining({ to: 'ada@example.com' })]);
      },
      { timeout: 10_000 },
    );
  });

  it('serves liveness and readiness over HTTP', async () => {
    const server = startHealthServer(app, 0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;

    const live = await fetch(`http://localhost:${port}/health/live`);
    const ready = await fetch(`http://localhost:${port}/health/ready`);
    const unknown = await fetch(`http://localhost:${port}/nope`);
    server.close();

    expect([live.status, ready.status, unknown.status]).toEqual([200, 200, 404]);
  });
});

describe('worker readiness without Redis', () => {
  it('reports 503 when the queue cannot reach Redis', async () => {
    const failingApp = {
      get: () => ({ getJobCounts: () => Promise.reject(new Error('ECONNREFUSED')) }),
    } as unknown as INestApplicationContext;
    const server = startHealthServer(failingApp, 0);
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const address = server.address();
    const port = typeof address === 'object' && address !== null ? address.port : 0;

    const ready = await fetch(`http://localhost:${port}/health/ready`);
    server.close();

    expect(ready.status).toBe(503);
  });
});
