/**
 * Minimal HTTP health endpoint for a process that has no HTTP API.
 * `/health/live`: the process is up. `/health/ready`: Redis answers.
 */
import { createServer, type Server } from 'node:http';
import { getQueueToken } from '@nestjs/bullmq';
import type { INestApplicationContext } from '@nestjs/common';
import { QUEUE_NAMES } from '@groundwork/shared';
import type { Queue } from 'bullmq';

async function isRedisReady(app: INestApplicationContext): Promise<boolean> {
  try {
    // Any queue command round-trips to Redis.
    await app.get<Queue>(getQueueToken(QUEUE_NAMES.email)).getJobCounts('waiting');
    return true;
  } catch {
    return false;
  }
}

export function startHealthServer(app: INestApplicationContext, port: number): Server {
  const server = createServer((request, response) => {
    const respond = (status: number): void => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ status: status === 200 ? 'ok' : 'error' }));
    };
    if (request.url === '/health/live') {
      respond(200);
      return;
    }
    if (request.url === '/health/ready') {
      void isRedisReady(app).then((ready) => {
        respond(ready ? 200 : 503);
      });
      return;
    }
    respond(404);
  });
  return server.listen(port);
}
