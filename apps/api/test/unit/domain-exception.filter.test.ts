import {
  type ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { DomainException } from '../../src/shared/errors/domain-exception.js';
import { DomainExceptionFilter } from '../../src/shared/errors/domain-exception.filter.js';

function render(exception: unknown): { status: number; body: unknown } {
  const json = vi.fn<(body: unknown) => void>();
  const status = vi.fn<(code: number) => { json: typeof json }>(() => ({ json }));
  const host = {
    switchToHttp: () => ({ getResponse: () => ({ status }) }),
  } as unknown as ArgumentsHost;

  new DomainExceptionFilter().catch(exception, host);

  return { status: Number(status.mock.calls[0]?.[0]), body: json.mock.calls[0]?.[0] };
}

function zodError(): z.ZodError {
  const result = z.object({ email: z.email() }).safeParse({ email: 'nope' });
  if (result.success) {
    throw new Error('expected a failure');
  }
  return result.error;
}

describe('DomainExceptionFilter', () => {
  beforeAll(() => {
    Logger.overrideLogger(false);
  });

  it('forwards a DomainException with its catalog status and meta', () => {
    const { status, body } = render(new DomainException('generic.conflict', { id: 'x' }));

    expect(status).toBe(HttpStatus.CONFLICT);
    expect(body).toEqual({
      code: 'generic.conflict',
      message: expect.any(String),
      meta: { id: 'x' },
    });
  });

  it('summarizes request validation issues', () => {
    const { status, body } = render(new ZodValidationException(zodError()));

    expect(status).toBe(HttpStatus.BAD_REQUEST);
    expect(body).toEqual({
      code: 'generic.validation_failed',
      message: expect.any(String),
      meta: { issues: [{ path: 'email', code: 'invalid_format', message: expect.any(String) }] },
    });
  });

  it('hides response serialization failures behind a generic 500', () => {
    const { status, body } = render(new ZodSerializationException(zodError()));

    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(body).toEqual({ code: 'generic.internal', message: expect.any(String) });
  });

  it('maps framework HTTP exceptions by status', () => {
    expect(render(new HttpException('Too many', HttpStatus.TOO_MANY_REQUESTS)).body).toMatchObject({
      code: 'generic.rate_limited',
    });
    expect(render(new ServiceUnavailableException()).body).toMatchObject({
      code: 'generic.internal',
    });
  });

  it('never leaks the details of an unexpected error', () => {
    const { status, body } = render(new Error('connection string with password'));

    expect(status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(JSON.stringify(body)).not.toContain('password');
  });
});
