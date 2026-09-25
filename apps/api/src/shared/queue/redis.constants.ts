/**
 * Injection token of the shared ioredis client (rate limiting, health checks).
 */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');
