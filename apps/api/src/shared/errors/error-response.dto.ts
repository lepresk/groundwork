/**
 * Nest DTO of the canonical error body `{ code, message, meta? }`, used by
 * `@ApiErrors` to document failures in OpenAPI.
 */
import { ErrorResponseSchema } from '@groundwork/shared';
import { createZodDto } from 'nestjs-zod';

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
