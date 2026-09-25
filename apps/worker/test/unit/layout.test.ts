/**
 * HTML escaping used by every email template.
 */
import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../../src/mail/templates/layout.js';

describe('escapeHtml', () => {
  it('escapes every HTML-significant character', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });
});
