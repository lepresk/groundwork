/**
 * Marks a route or controller as requiring a valid session, and documents
 * the cookie security scheme in OpenAPI.
 */
import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiCookieAuth } from '@nestjs/swagger';
import { SESSION_SECURITY_SCHEME } from '../../../app.factory.js';
import { ApiErrors } from '../../../shared/errors/api-errors.decorator.js';
import { SessionGuard } from './session.guard.js';

export function Authenticated(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    UseGuards(SessionGuard),
    ApiCookieAuth(SESSION_SECURITY_SCHEME),
    ApiErrors('auth.session_invalid'),
  );
}
