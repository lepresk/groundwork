/**
 * Documents the error responses of an endpoint in OpenAPI with the
 * canonical error body, so clients see every code a route can return.
 */
import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import type { ErrorCode } from '@groundwork/shared';
import { ERROR_CATALOG } from './error-catalog.js';
import { ErrorResponseDto } from './error-response.dto.js';

export function ApiErrors(...codes: readonly ErrorCode[]): MethodDecorator & ClassDecorator {
  const byStatus = new Map<number, ErrorCode[]>();
  for (const code of [...codes, 'generic.validation_failed' as const]) {
    const status = ERROR_CATALOG[code].status;
    byStatus.set(status, [...(byStatus.get(status) ?? []), code]);
  }

  return applyDecorators(
    ...[...byStatus.entries()].map(([status, statusCodes]) =>
      ApiResponse({ status, type: ErrorResponseDto, description: statusCodes.join(', ') }),
    ),
  );
}
