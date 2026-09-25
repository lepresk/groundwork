/**
 * Renders every exception as the canonical error body `{ code, message, meta? }`.
 *
 * - DomainException: forwarded as-is.
 * - Request validation failure (Zod pipe): 400 `generic.validation_failed`.
 * - Response serialization failure: 500 `generic.internal`, logged, because
 *   it always means the server tried to return an undeclared shape.
 * - Other HttpException (guards, throttler, 404 routing): mapped by status.
 * - Anything else: logged and returned as 500 `generic.internal`.
 */
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ErrorCode, ErrorResponse } from '@groundwork/shared';
import type { Response } from 'express';
import { ZodSerializationException, ZodValidationException } from 'nestjs-zod';
import { ZodError } from 'zod';
import { DomainException } from './domain-exception.js';
import { ERROR_CATALOG } from './error-catalog.js';

const STATUS_TO_CODE: Partial<Record<number, ErrorCode>> = {
  [HttpStatus.BAD_REQUEST]: 'generic.bad_request',
  [HttpStatus.UNAUTHORIZED]: 'generic.unauthorized',
  [HttpStatus.FORBIDDEN]: 'generic.forbidden',
  [HttpStatus.NOT_FOUND]: 'generic.not_found',
  [HttpStatus.CONFLICT]: 'generic.conflict',
  [HttpStatus.TOO_MANY_REQUESTS]: 'generic.rate_limited',
};

/** Keeps only what a client needs to point at the faulty field. */
function summarizeIssues(
  exception: ZodValidationException,
): { path: string; code: string; message: string }[] {
  const error = exception.getZodError();
  if (!(error instanceof ZodError)) {
    return [];
  }
  return error.issues.map((issue) => ({
    path: issue.path.map(String).join('.'),
    code: issue.code,
    message: issue.message,
  }));
}

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.render(exception);
    response.status(status).json(body);
  }

  private render(exception: unknown): { status: number; body: ErrorResponse } {
    if (exception instanceof DomainException) {
      return { status: exception.getStatus(), body: exception.getResponse() as ErrorResponse };
    }

    if (exception instanceof ZodValidationException) {
      return this.fromCode('generic.validation_failed', { issues: summarizeIssues(exception) });
    }

    if (exception instanceof ZodSerializationException) {
      this.logger.error({ err: exception.getZodError() }, 'Response failed schema validation');
      return this.fromCode('generic.internal');
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const code = STATUS_TO_CODE[status] ?? 'generic.internal';
      return { status, body: { code, message: ERROR_CATALOG[code].message } };
    }

    this.logger.error({ err: exception }, 'Unhandled exception');
    return this.fromCode('generic.internal');
  }

  private fromCode(
    code: ErrorCode,
    meta?: Record<string, unknown>,
  ): { status: number; body: ErrorResponse } {
    const { status, message } = ERROR_CATALOG[code];
    return { status, body: meta === undefined ? { code, message } : { code, message, meta } };
  }
}
