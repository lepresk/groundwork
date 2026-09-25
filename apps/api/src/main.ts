/**
 * Process entry point: builds the Nest application and starts listening.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { configureApp } from './app.factory.js';
import { AppModule } from './app.module.js';
import { env } from './config/env.js';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  configureApp(app, { swagger: env.NODE_ENV !== 'production' });
  app.enableShutdownHooks();

  await app.listen(env.API_PORT);
  app.get(Logger).log(`API listening on http://localhost:${env.API_PORT}`, 'Bootstrap');
}

void bootstrap();
