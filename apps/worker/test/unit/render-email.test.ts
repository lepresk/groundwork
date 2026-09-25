/**
 * Email templates: subjects, action links in both bodies, and escaping of
 * user-controlled data.
 */
import type { EmailJob } from '@groundwork/shared';
import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../src/mail/templates/layout.js';
import { renderEmail } from '../../src/mail/templates/render-email.js';

describe('renderEmail', () => {
  it.each<[EmailJob, string, string]>([
    [
      {
        template: 'verify_email',
        to: 'a@b.co',
        data: { firstName: 'Ada', verificationUrl: 'http://x.test/v?token=1' },
      },
      'Confirm your email address',
      'http://x.test/v?token=1',
    ],
    [
      {
        template: 'reset_password',
        to: 'a@b.co',
        data: { firstName: 'Ada', resetUrl: 'http://x.test/r?token=2' },
      },
      'Reset your password',
      'http://x.test/r?token=2',
    ],
  ])('renders %# with its subject and action link in both bodies', (job, subject, url) => {
    const email = renderEmail(job);

    expect(email.subject).toBe(subject);
    expect(email.text).toContain(url);
    expect(email.html).toContain(escapeHtml(url));
  });

  it('renders the two-factor change notice for both states', () => {
    const enabled = renderEmail({
      template: 'two_factor_changed',
      to: 'a@b.co',
      data: { firstName: 'Ada', enabled: true },
    });
    const disabled = renderEmail({
      template: 'two_factor_changed',
      to: 'a@b.co',
      data: { firstName: 'Ada', enabled: false },
    });

    expect(enabled.subject).toMatch(/enabled/);
    expect(disabled.subject).toMatch(/disabled/);
    expect(disabled.html).not.toContain('<a ');
  });

  it('escapes user-controlled data in the HTML body', () => {
    const email = renderEmail({
      template: 'verify_email',
      to: 'a@b.co',
      data: { firstName: '<script>alert("x")</script>', verificationUrl: 'http://x.test/' },
    });

    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});
