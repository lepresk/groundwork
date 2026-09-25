/**
 * Throttler guard keyed on the real client IP (see `resolveClientContext`)
 * instead of the BFF server address.
 */
import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';
import { resolveClientContext } from '../http/client-context.js';

@Injectable()
export class ClientAwareThrottlerGuard extends ThrottlerGuard {
  protected override getTracker(request: Record<string, unknown>): Promise<string> {
    return Promise.resolve(
      resolveClientContext(request as unknown as Request).ipAddress ?? 'unknown',
    );
  }
}
