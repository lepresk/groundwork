/**
 * Persistence for `users`. Email lookups are case-insensitive.
 */
import { Injectable } from '@nestjs/common';
import { users, type UserRow } from '@groundwork/db';
import { eq, sql } from 'drizzle-orm';
import type { DbExecutor } from '../../../shared/db/db.service.js';

export interface CreateUserInput {
  readonly email: string;
  readonly passwordHash: string;
  readonly firstName: string;
  readonly lastName: string;
}

@Injectable()
export class UsersRepository {
  async create(db: DbExecutor, input: CreateUserInput): Promise<UserRow> {
    const [row] = await db.insert(users).values(input).returning();
    if (row === undefined) {
      throw new Error('User insert returned no row.');
    }
    return row;
  }

  async findById(db: DbExecutor, id: string): Promise<UserRow | null> {
    const [row] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return row ?? null;
  }

  async findByEmail(db: DbExecutor, email: string): Promise<UserRow | null> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(sql`lower(${users.email})`, email.toLowerCase()))
      .limit(1);
    return row ?? null;
  }

  async markEmailVerified(db: DbExecutor, id: string, at: Date): Promise<void> {
    await db
      .update(users)
      .set({ emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, ${at})` })
      .where(eq(users.id, id));
  }

  async updatePassword(db: DbExecutor, id: string, passwordHash: string, at: Date): Promise<void> {
    await db.update(users).set({ passwordHash, passwordChangedAt: at }).where(eq(users.id, id));
  }
}
