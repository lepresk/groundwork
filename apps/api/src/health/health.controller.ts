/**
 * Orchestrator probes, unversioned and never rate limited.
 * - `/health/live`: the process is up. Touches no dependency.
 * - `/health/ready`: Postgres and Redis answer. 503 otherwise.
 */
import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { DbHealthIndicator } from './db.health.js';
import { RedisHealthIndicator } from './redis.health.js';

@ApiTags('Health')
@SkipThrottle()
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: DbHealthIndicator,
    private readonly redis: RedisHealthIndicator,
  ) {}

  @Get('live')
  @HealthCheck()
  live(): Promise<HealthCheckResult> {
    return this.health.check([]);
  }

  @Get('ready')
  @HealthCheck()
  ready(): Promise<HealthCheckResult> {
    return this.health.check([() => this.db.check('postgres'), () => this.redis.check('redis')]);
  }
}
