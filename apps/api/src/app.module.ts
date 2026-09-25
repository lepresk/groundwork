/**
 * Root module: global infrastructure first, then feature modules.
 * `pnpm gen module <name>` registers new feature modules at the markers.
 */
import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { DbModule } from './shared/db/db.module.js';
import { DomainExceptionFilter } from './shared/errors/domain-exception.filter.js';
import { LoggingModule } from './shared/logging/logging.module.js';
import { QueueModule } from './shared/queue/queue.module.js';
import { ThrottlingModule } from './shared/throttling/throttling.module.js';
// gen:module-imports

@Module({
  imports: [
    LoggingModule,
    DbModule,
    QueueModule,
    ThrottlingModule,
    HealthModule,
    AuthModule,
    // gen:modules
  ],
  providers: [{ provide: APP_FILTER, useClass: DomainExceptionFilter }],
})
export class AppModule {}
