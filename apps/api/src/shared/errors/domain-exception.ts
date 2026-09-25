/**
 * HTTP exception carrying a stable domain error code. Controllers throw it
 * when an action returns a failed `Result`; the global filter renders it as
 * the canonical `{ code, message, meta? }` body.
 */
import { HttpException } from '@nestjs/common';
import type { ErrorCode, ErrorResponse } from '@groundwork/shared';
import { ERROR_CATALOG } from './error-catalog.js';

export class DomainException extends HttpException {
  constructor(
    public readonly code: ErrorCode,
    meta?: Record<string, unknown>,
  ) {
    const { status, message } = ERROR_CATALOG[code];
    const body: ErrorResponse = meta === undefined ? { code, message } : { code, message, meta };
    super(body, status);
  }
}
