/**
 * Queue contracts between producers (api) and consumers (worker).
 *
 * Every job payload is a Zod schema: producers validate before enqueueing,
 * consumers validate again before processing, so a deploy skew between the
 * two apps fails loudly instead of sending a malformed email.
 */
import { z } from 'zod';

export const QUEUE_NAMES = { email: 'email' } as const;

export const EMAIL_JOB_NAME = 'send-email';

export const EmailJobSchema = z.discriminatedUnion('template', [
  z.strictObject({
    template: z.literal('verify_email'),
    to: z.email(),
    data: z.strictObject({ firstName: z.string(), verificationUrl: z.url() }),
  }),
  z.strictObject({
    template: z.literal('reset_password'),
    to: z.email(),
    data: z.strictObject({ firstName: z.string(), resetUrl: z.url() }),
  }),
  z.strictObject({
    template: z.literal('two_factor_changed'),
    to: z.email(),
    data: z.strictObject({ firstName: z.string(), enabled: z.boolean() }),
  }),
]);

export type EmailJob = z.infer<typeof EmailJobSchema>;
export type EmailTemplate = EmailJob['template'];
