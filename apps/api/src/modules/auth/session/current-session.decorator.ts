/**
 * Injects the authenticated session. Only valid on `@Authenticated()` routes.
 */
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import { DomainException } from '../../../shared/errors/domain-exception.js';
import type { AuthenticatedRequest, AuthenticatedSession } from './session.types.js';

export const CurrentSession = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedSession => {
    const auth = context.switchToHttp().getRequest<AuthenticatedRequest>().auth;
    if (auth === undefined) {
      throw new DomainException('auth.session_invalid');
    }
    return auth;
  },
);
