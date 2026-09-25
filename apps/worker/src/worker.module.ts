/**
 * Root module of the worker. `pnpm gen` does not touch it: register new
 * processors here next to the queue they consume.
 */
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { QUEUE_NAMES } from '@groundwork/shared';
import { LoggerModule } from 'nestjs-pino';
import { env } from './config/env.js';
import { EmailProcessor } from './email/email.processor.js';
import { MAIL_TRANSPORT } from './mail/mail-transport.js';
import { SmtpMailTransport } from './mail/smtp-mail-transport.js';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL,
        ...(env.NODE_ENV === 'development'
          ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
          : {}),
      },
    }),
    BullModule.forRoot({ connection: { url: env.REDIS_URL }, prefix: env.QUEUE_PREFIX }),
    BullModule.registerQueue({ name: QUEUE_NAMES.email }),
  ],
  providers: [{ provide: MAIL_TRANSPORT, useClass: SmtpMailTransport }, EmailProcessor],
})
export class WorkerModule {}
