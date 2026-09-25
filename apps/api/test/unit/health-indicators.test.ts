/**
 * Health indicators report `down` with the failure reason when a
 * dependency is unreachable.
 */
import { HealthIndicatorService } from '@nestjs/terminus';
import { describe, expect, it } from 'vitest';
import { DbHealthIndicator } from '../../src/health/db.health.js';
import { RedisHealthIndicator } from '../../src/health/redis.health.js';
import type { DbService } from '../../src/shared/db/db.service.js';

describe('health indicators', () => {
  it('reports Postgres down with the failure reason', async () => {
    const db = { ping: () => Promise.reject(new Error('ECONNREFUSED')) } as unknown as DbService;

    const result = await new DbHealthIndicator(db, new HealthIndicatorService()).check('postgres');

    expect(result).toEqual({ postgres: { status: 'down', message: 'ECONNREFUSED' } });
  });

  it('reports Redis down with the failure reason', async () => {
    const redis = { ping: () => Promise.reject(new Error('timeout')) };

    const result = await new RedisHealthIndicator(
      redis as never,
      new HealthIndicatorService(),
    ).check('redis');

    expect(result).toEqual({ redis: { status: 'down', message: 'timeout' } });
  });
});
