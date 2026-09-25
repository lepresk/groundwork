/**
 * Port for outgoing email. Production uses SMTP; tests inject a recorder.
 * Swap the implementation (Resend, SES, Postmark) without touching jobs.
 */
export const MAIL_TRANSPORT = Symbol('MAIL_TRANSPORT');

export interface MailMessage {
  readonly to: string;
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface MailTransport {
  send(message: MailMessage): Promise<void>;
}
