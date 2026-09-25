/**
 * Boots the real AppModule against the test database with the production
 * HTTP pipeline (`configureApp`). Only the BullMQ queue is replaced, by a
 * recorder, so tests can assert which jobs were enqueued without Redis
 * workers running.
 */
import { getQueueToken } from '@nestjs/bullmq';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { QUEUE_NAMES, EmailJobSchema, type EmailJob } from '@groundwork/shared';
import type { Database } from '@groundwork/db';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { vi } from 'vitest';
import { configureApp } from '../../src/app.factory.js';
import { AppModule } from '../../src/app.module.js';
import { DbService } from '../../src/shared/db/db.service.js';

export interface TestApp {
  readonly app: INestApplication;
  readonly db: Database;
  readonly http: () => ReturnType<typeof request>;
  readonly agent: () => ReturnType<typeof request.agent>;
  /** Email jobs enqueued since the last `reset()`, parsed with the shared contract. */
  readonly emails: () => EmailJob[];
  readonly reset: () => Promise<void>;
  readonly close: () => Promise<void>;
}

export async function createTestApp(): Promise<TestApp> {
  const queueAdd = vi.fn<(name: string, data: unknown) => Promise<void>>().mockResolvedValue();

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(getQueueToken(QUEUE_NAMES.email))
    .useValue({ add: queueAdd })
    .compile();

  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app, { swagger: false });
  await app.init();

  const db = app.get(DbService).client;

  return {
    app,
    db,
    http: () => request(app.getHttpServer()),
    agent: () => request.agent(app.getHttpServer()),
    emails: () => queueAdd.mock.calls.map(([, data]) => EmailJobSchema.parse(data)),
    reset: async () => {
      queueAdd.mockClear();
      await truncateAllTables(db);
    },
    close: () => app.close(),
  };
}

/** Empties every application table. Discovered dynamically so new modules need no change. */
export async function truncateAllTables(db: Database): Promise<void> {
  const result = await db.execute<{ tablename: string }>(
    sql`select tablename from pg_tables where schemaname = 'public'`,
  );
  const tables = result.rows.map((row) => `"public"."${row.tablename}"`);
  if (tables.length > 0) {
    await db.execute(sql.raw(`truncate table ${tables.join(', ')} restart identity cascade`));
  }
}

/** Extracts the `token` query parameter from a link sent by email. */
export function tokenFromLink(link: string): string {
  const token = new URL(link).searchParams.get('token');
  if (token === null) {
    throw new Error(`No token in link: ${link}`);
  }
  return token;
}
