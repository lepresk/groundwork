/**
 * Global rate limiting backed by Redis (in-memory in tests). The default
 * budget is generous; sensitive routes tighten it with `@AuthThrottle()`.
 */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerStorageService } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import type { Redis } from 'ioredis';
import { env } from '../../config/env.js';
import { REDIS_CLIENT } from '../queue/redis.constants.js';
import { ClientAwareThrottlerGuard } from './client-aware-throttler.guard.js';

const DEFAULT_TTL_MS = 60_000;
const DEFAULT_LIMIT = 300;

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [REDIS_CLIENT],
      useFactory: (redis: Redis) => ({
        throttlers: [{ name: 'default', ttl: DEFAULT_TTL_MS, limit: DEFAULT_LIMIT }],
        storage:
          env.NODE_ENV === 'test'
            ? new ThrottlerStorageService()
            : new ThrottlerStorageRedisService(redis),
      }),
    }),
  ],
  providers: [{ provide: APP_GUARD, useClass: ClientAwareThrottlerGuard }],
})
export class ThrottlingModule {}
