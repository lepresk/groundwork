import { afterEach, describe, expect, it, vi } from 'vitest';

const createTransport = vi.fn(() => ({ sendMail: vi.fn(), close: vi.fn() }));
vi.mock('nodemailer', () => ({ createTransport }));

async function loadTransport(envOverrides: Record<string, unknown>) {
  vi.resetModules();
  vi.doMock('../../src/config/env.js', () => ({
    env: {
      SMTP_HOST: 'smtp.test',
      SMTP_PORT: 587,
      SMTP_SECURE: false,
      MAIL_FROM: 'App <a@b.co>',
      ...envOverrides,
    },
  }));
  const { SmtpMailTransport } = await import('../../src/mail/smtp-mail-transport.js');
  return new SmtpMailTransport();
}

describe('SmtpMailTransport', () => {
  afterEach(() => {
    createTransport.mockClear();
    vi.doUnmock('../../src/config/env.js');
  });

  it('connects without credentials when none are configured', async () => {
    await loadTransport({ SMTP_USER: '' });

    expect(createTransport).toHaveBeenCalledWith({ host: 'smtp.test', port: 587, secure: false });
  });

  it('authenticates when credentials are configured', async () => {
    await loadTransport({ SMTP_USER: 'user', SMTP_PASSWORD: 'pass' });

    expect(createTransport).toHaveBeenCalledWith(
      expect.objectContaining({ auth: { user: 'user', pass: 'pass' } }),
    );
  });

  it('sends from the configured sender and closes the pool on shutdown', async () => {
    const transport = await loadTransport({});
    const client = createTransport.mock.results[0]?.value as {
      sendMail: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
    };

    await transport.send({ to: 'x@y.co', subject: 'S', html: '<p>H</p>', text: 'H' });
    transport.onModuleDestroy();

    expect(client.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'App <a@b.co>', to: 'x@y.co' }),
    );
    expect(client.close).toHaveBeenCalled();
  });
});
