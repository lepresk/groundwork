/**
 * Health probes and the canonical 404 body on the real application.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../helpers/test-app.js';

describe('health probes', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  afterAll(async () => {
    await t.close();
  });

  it('reports liveness without touching dependencies', async () => {
    const response = await t.http().get('/health/live');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('reports readiness when Postgres and Redis answer', async () => {
    const response = await t.http().get('/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.info).toEqual({ postgres: { status: 'up' }, redis: { status: 'up' } });
  });

  it('returns the canonical error body for unknown routes', async () => {
    const response = await t.http().get('/api/v1/does-not-exist');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({ code: 'generic.not_found', message: expect.any(String) });
  });
});
