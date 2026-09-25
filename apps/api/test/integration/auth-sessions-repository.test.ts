import { authSessions } from '@groundwork/db';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { SESSION_IDLE_TTL_MS } from '../../src/modules/auth/auth.constants.js';
import { AuthSessionsRepository } from '../../src/modules/auth/repositories/auth-sessions.repository.js';
import { createUser } from '../helpers/fixtures.js';
import { createTestApp, type TestApp } from '../helpers/test-app.js';

const MINUTE = 60_000;

describe('AuthSessionsRepository.recordActivity', () => {
  let t: TestApp;
  const repository = new AuthSessionsRepository();

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
  });

  afterAll(async () => {
    await t.close();
  });

  async function insertSession(lastActivityAt: Date, expiresAt: Date) {
    const user = await createUser(t.db);
    const [row] = await t.db
      .insert(authSessions)
      .values({ userId: user.id, lastActivityAt, expiresAt })
      .returning();
    if (row === undefined) {
      throw new Error('no session');
    }
    return row;
  }

  it('does not write when activity was recorded less than a minute ago', async () => {
    const now = new Date();
    const session = await insertSession(
      new Date(now.getTime() - 10_000),
      new Date(now.getTime() + MINUTE),
    );

    await repository.recordActivity(t.db, session, now);

    const [row] = await t.db.select().from(authSessions);
    expect(row?.expiresAt.getTime()).toBe(session.expiresAt.getTime());
  });

  it('slides an idle session to the full idle TTL', async () => {
    const now = new Date();
    const session = await insertSession(
      new Date(now.getTime() - 5 * MINUTE),
      new Date(now.getTime() + MINUTE),
    );

    await repository.recordActivity(t.db, session, now);

    const [row] = await t.db.select().from(authSessions);
    expect(row?.expiresAt.getTime()).toBe(now.getTime() + SESSION_IDLE_TTL_MS);
    expect(row?.lastActivityAt.getTime()).toBe(now.getTime());
  });

  it('never shortens a remember-me session', async () => {
    const now = new Date();
    const farExpiry = new Date(now.getTime() + 20 * 24 * 60 * MINUTE);
    const session = await insertSession(new Date(now.getTime() - 5 * MINUTE), farExpiry);

    await repository.recordActivity(t.db, session, now);

    const [row] = await t.db.select().from(authSessions);
    expect(row?.expiresAt.getTime()).toBe(farExpiry.getTime());
  });
});
