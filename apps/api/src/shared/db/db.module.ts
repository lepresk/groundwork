/**
 * Provides the Drizzle database handle to the whole application and closes
 * the pool on shutdown.
 */
import { Global, Inject, Module, type OnApplicationShutdown } from '@nestjs/common';
import { createDatabase, type DatabaseHandle } from '@groundwork/db';
import { env } from '../../config/env.js';
import { DATABASE_HANDLE, DbService } from './db.service.js';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_HANDLE,
      useFactory: (): DatabaseHandle => createDatabase(env.DATABASE_URL),
    },
    DbService,
  ],
  exports: [DbService],
})
export class DbModule implements OnApplicationShutdown {
  constructor(@Inject(DATABASE_HANDLE) private readonly handle: DatabaseHandle) {}

  async onApplicationShutdown(): Promise<void> {
    await this.handle.pool.end();
  }
}
