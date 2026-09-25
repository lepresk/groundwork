/**
 * Worker entry point: a Nest application context (no HTTP API) that runs
 * the BullMQ processors, plus a minimal health endpoint for orchestrators.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { env } from './config/env.js';
import { startHealthServer } from './health/health-server.js';
import { WorkerModule } from './worker.module.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);
  app.enableShutdownHooks();

  const healthServer = startHealthServer(app, env.WORKER_HEALTH_PORT);
  process.once('SIGTERM', () => healthServer.close());
  logger.log(`Worker started, health on http://localhost:${env.WORKER_HEALTH_PORT}`, 'Bootstrap');
}

void bootstrap();
