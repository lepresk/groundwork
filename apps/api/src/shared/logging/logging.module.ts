/**
 * Structured JSON logging with pino. Pretty-printed in development,
 * silent in tests, JSON in production. Request logs carry only the method,
 * URL, and request id: headers (cookies, tokens) never reach the logs.
 */
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { env } from '../../config/env.js';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
        serializers: {
          req: (req: { id: unknown; method: string; url: string }) => ({
            id: req.id,
            method: req.method,
            url: req.url,
          }),
          res: (res: { statusCode: number }) => ({ statusCode: res.statusCode }),
        },
        autoLogging: { ignore: (req) => req.url?.startsWith('/health') ?? false },
        ...(env.NODE_ENV === 'development'
          ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
          : {}),
      },
    }),
  ],
})
export class LoggingModule {}
