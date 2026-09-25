/**
 * Tight rate limit for credential and email-sending endpoints.
 */
import { Throttle } from '@nestjs/throttler';
import { env } from '../../config/env.js';

const AUTH_THROTTLE_TTL_MS = 15 * 60_000;

export const AuthThrottle = (): MethodDecorator & ClassDecorator =>
  Throttle({ default: { limit: env.AUTH_THROTTLE_LIMIT, ttl: AUTH_THROTTLE_TTL_MS } });
