/**
 * Minimal, inline-styled email layout. Every interpolated value must go
 * through `escapeHtml`: template data can contain user input (names).
 */
const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPES[character] ?? character);
}

export interface RenderedEmail {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export function layout(options: {
  subject: string;
  paragraphs: readonly string[];
  action?: { label: string; url: string };
}): RenderedEmail {
  const paragraphsHtml = options.paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph)}</p>`)
    .join('');
  const actionHtml =
    options.action === undefined
      ? ''
      : `<p style="margin:24px 0"><a href="${escapeHtml(options.action.url)}" style="background:#111827;color:#ffffff;padding:12px 20px;border-radius:6px;text-decoration:none;display:inline-block">${escapeHtml(options.action.label)}</a></p>`;

  const html = `<!doctype html><html><body style="font-family:system-ui,sans-serif;color:#111827;line-height:1.5;max-width:560px;margin:0 auto;padding:32px 16px">${paragraphsHtml}${actionHtml}</body></html>`;
  const text = [
    ...options.paragraphs,
    ...(options.action === undefined ? [] : [`${options.action.label}: ${options.action.url}`]),
  ].join('\n\n');

  return { subject: options.subject, html, text };
}
