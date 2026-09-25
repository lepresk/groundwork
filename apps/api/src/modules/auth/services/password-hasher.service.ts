/**
 * Password hashing with argon2id (OWASP recommended parameters).
 *
 * `verifyOrWaste` always performs one argon2 verification, even when the
 * account does not exist, so login latency does not reveal which emails
 * are registered.
 */
import { Injectable, type OnModuleInit } from '@nestjs/common';
import argon2 from 'argon2';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

@Injectable()
export class PasswordHasher implements OnModuleInit {
  private dummyHash = '';

  async onModuleInit(): Promise<void> {
    this.dummyHash = await this.hash('dummy-password-for-timing-safety');
  }

  hash(password: string): Promise<string> {
    return argon2.hash(password, ARGON2_OPTIONS);
  }

  verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  async verifyOrWaste(hash: string | undefined, password: string): Promise<boolean> {
    const matches = await argon2.verify(hash ?? this.dummyHash, password);
    return hash !== undefined && matches;
  }
}
