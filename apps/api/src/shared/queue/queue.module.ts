/**
 * Redis connection shared by BullMQ producers, rate limiting, and health.
 * Registers every queue this app produces to; consumers live in apps/worker.
 */
import { BullModule } from '@nestjs/bullmq';
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { QUEUE_NAMES } from '@groundwork/shared';
import { Redis } from 'ioredis';
import { env } from '../../config/env.js';
import { EmailQueue } from './email-queue.service.js';
import { REDIS_CLIENT } from './redis.constants.js';

@Global()
@Module({
  imports: [
    BullModule.forRoot({ connection: { url: env.REDIS_URL }, prefix: env.QUEUE_PREFIX }),
    BullModule.registerQueue({ name: QUEUE_NAMES.email }),
  ],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (): Redis => new Redis(env.REDIS_URL, { maxRetriesPerRequest: null }),
    },
    EmailQueue,
  ],
  exports: [REDIS_CLIENT, EmailQueue],
})
export class QueueModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.redis.quit();
  }
}
