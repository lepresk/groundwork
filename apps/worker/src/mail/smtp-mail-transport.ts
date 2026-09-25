/**
 * SMTP implementation of `MailTransport` (Mailpit locally).
 */
import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';
import { env } from '../config/env.js';
import type { MailMessage, MailTransport } from './mail-transport.js';

@Injectable()
export class SmtpMailTransport implements MailTransport, OnModuleDestroy {
  private readonly transporter: Transporter = createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER === undefined || env.SMTP_USER === ''
      ? {}
      : { auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? '' } }),
  });

  async send(message: MailMessage): Promise<void> {
    await this.transporter.sendMail({ from: env.MAIL_FROM, ...message });
  }

  onModuleDestroy(): void {
    this.transporter.close();
  }
}
