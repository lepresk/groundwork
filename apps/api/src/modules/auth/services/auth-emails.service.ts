/**
 * Builds and enqueues the transactional emails of the auth module. Links
 * point to the web app, which owns the pages that consume the tokens.
 */
import { Injectable } from '@nestjs/common';
import type { UserRow } from '@groundwork/db';
import { registerAfterCommitHook } from '@lepresk/after-commit';
import { env } from '../../../config/env.js';
import { EmailQueue } from '../../../shared/queue/email-queue.service.js';

type Recipient = Pick<UserRow, 'email' | 'firstName'>;

@Injectable()
export class AuthEmails {
  constructor(private readonly queue: EmailQueue) {}

  /** Enqueued after the surrounding transaction commits. */
  sendVerification(user: Recipient, token: string): void {
    const verificationUrl = this.webUrl('/verify-email', token);
    registerAfterCommitHook(() =>
      this.queue.enqueue({
        template: 'verify_email',
        to: user.email,
        data: { firstName: user.firstName, verificationUrl },
      }),
    );
  }

  /** Enqueued after the surrounding transaction commits. */
  sendPasswordReset(user: Recipient, token: string): void {
    const resetUrl = this.webUrl('/reset-password', token);
    registerAfterCommitHook(() =>
      this.queue.enqueue({
        template: 'reset_password',
        to: user.email,
        data: { firstName: user.firstName, resetUrl },
      }),
    );
  }

  /** Enqueued after the surrounding transaction commits. */
  sendTwoFactorChanged(user: Recipient, enabled: boolean): void {
    registerAfterCommitHook(() =>
      this.queue.enqueue({
        template: 'two_factor_changed',
        to: user.email,
        data: { firstName: user.firstName, enabled },
      }),
    );
  }

  private webUrl(path: string, token: string): string {
    const url = new URL(path, env.WEB_PUBLIC_URL);
    url.searchParams.set('token', token);
    return url.toString();
  }
}
