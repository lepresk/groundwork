/**
 * Entry point for database access from repositories and actions.
 *
 * `transaction()` opens an after-commit context around the transaction:
 * side effects registered with `registerAfterCommitHook` anywhere inside
 * the callback (enqueueing an email, publishing an event) run only once the
 * transaction has committed, and are discarded on rollback.
 */
import { Inject, Injectable } from '@nestjs/common';
import type { Database, DatabaseHandle } from '@groundwork/db';
import { runWithAfterCommitContext } from '@lepresk/after-commit';
import { sql } from 'drizzle-orm';

export const DATABASE_HANDLE = Symbol('DATABASE_HANDLE');

/** Either the root client or an open transaction; repositories accept both. */
export type DbExecutor = Pick<Database, 'select' | 'insert' | 'update' | 'delete' | 'execute'>;

@Injectable()
export class DbService {
  public readonly client: Database;

  constructor(@Inject(DATABASE_HANDLE) handle: DatabaseHandle) {
    this.client = handle.db;
  }

  async transaction<T>(callback: (tx: DbExecutor) => Promise<T>): Promise<T> {
    return runWithAfterCommitContext(() => this.client.transaction(callback));
  }

  async ping(): Promise<void> {
    await this.client.execute(sql`select 1`);
  }
}
