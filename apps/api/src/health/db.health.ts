/**
 * Readiness indicator: a `select 1` round-trip to Postgres.
 */
import { Injectable } from '@nestjs/common';
import { HealthIndicatorService, type HealthIndicatorResult } from '@nestjs/terminus';
import { DbService } from '../shared/db/db.service.js';

@Injectable()
export class DbHealthIndicator {
  constructor(
    private readonly db: DbService,
    private readonly health: HealthIndicatorService,
  ) {}

  async check(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.health.check(key);
    try {
      await this.db.ping();
      return indicator.up();
    } catch (error) {
      return indicator.down({ message: error instanceof Error ? error.message : 'unreachable' });
    }
  }
}
