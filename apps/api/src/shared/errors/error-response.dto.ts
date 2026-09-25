import { ErrorResponseSchema } from '@groundwork/shared';
import { createZodDto } from 'nestjs-zod';

export class ErrorResponseDto extends createZodDto(ErrorResponseSchema) {}
