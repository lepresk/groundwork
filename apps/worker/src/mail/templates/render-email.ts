/**
 * Renders an email job into subject, HTML, and plain-text bodies.
 * The switch is exhaustive: adding a template to the shared contract
 * without rendering it here fails type checking and linting.
 */
import type { EmailJob } from '@groundwork/shared';
import { layout, type RenderedEmail } from './layout.js';

export function renderEmail(job: EmailJob): RenderedEmail {
  switch (job.template) {
    case 'verify_email':
      return layout({
        subject: 'Confirm your email address',
        paragraphs: [
          `Hi ${job.data.firstName},`,
          'Confirm your email address to finish creating your account. The link expires in 24 hours.',
        ],
        action: { label: 'Confirm email', url: job.data.verificationUrl },
      });
    case 'reset_password':
      return layout({
        subject: 'Reset your password',
        paragraphs: [
          `Hi ${job.data.firstName},`,
          'We received a request to reset your password. The link expires in 1 hour.',
          'If you did not request this, you can ignore this email: your password stays unchanged.',
        ],
        action: { label: 'Choose a new password', url: job.data.resetUrl },
      });
    case 'two_factor_changed':
      return layout({
        subject: job.data.enabled
          ? 'Two-factor authentication enabled'
          : 'Two-factor authentication disabled',
        paragraphs: [
          `Hi ${job.data.firstName},`,
          job.data.enabled
            ? 'Two-factor authentication is now enabled on your account.'
            : 'Two-factor authentication has been disabled on your account.',
          'If you did not make this change, reset your password immediately.',
        ],
      });
  }
}
