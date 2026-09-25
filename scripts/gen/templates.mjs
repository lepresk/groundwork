/**
 * File templates for `pnpm gen module`. The output follows the repository
 * conventions exactly (action pattern, Result types, strict Zod contracts,
 * cursor pagination, ownership checks, integration tests on a real DB), so
 * a generated module passes lint, typecheck, and tests untouched.
 */

export const schemaTable = (n) => `/**
 * \`${n.snakePlural}\`: owned by a user. Replace \`name\` with the real columns.
 */
import { index, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { id, timestamps } from './_columns.js';
import { users } from './users.js';

export const ${n.camelPlural} = pgTable(
  '${n.snakePlural}',
  {
    id: id(),
    ownerId: uuid()
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text().notNull(),
    ...timestamps,
  },
  (table) => [index('${n.snakePlural}_owner_created_idx').on(table.ownerId, table.createdAt, table.id)],
);

export type ${n.pascal}Row = typeof ${n.camelPlural}.$inferSelect;
`;

export const sharedContracts = (n) => `/**
 * ${n.title} contracts shared by the API and the web app.
 */
import { z } from 'zod';
import { cursorPageSchema } from './pagination.js';

export const ${n.pascal}Schema = z.strictObject({
  id: z.uuid(),
  name: z.string(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
export type ${n.pascal} = z.infer<typeof ${n.pascal}Schema>;

export const Create${n.pascal}RequestSchema = z.strictObject({
  name: z.string().trim().min(1).max(200),
});
export type Create${n.pascal}Request = z.infer<typeof Create${n.pascal}RequestSchema>;

export const ${n.pascal}ListResponseSchema = cursorPageSchema(${n.pascal}Schema);
export type ${n.pascal}ListResponse = z.infer<typeof ${n.pascal}ListResponseSchema>;
`;

export const apiSchemas = (n) => `/**
 * Nest DTOs generated from the shared ${n.title} contracts.
 */
import {
  Create${n.pascal}RequestSchema,
  CursorPageQuerySchema,
  ${n.pascal}ListResponseSchema,
  ${n.pascal}Schema,
} from '@groundwork/shared';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export class ${n.pascal}Dto extends createZodDto(${n.pascal}Schema) {}
export class Create${n.pascal}RequestDto extends createZodDto(Create${n.pascal}RequestSchema) {}
export class ${n.pascal}ListResponseDto extends createZodDto(${n.pascal}ListResponseSchema) {}
export class ${n.pascal}ListQueryDto extends createZodDto(CursorPageQuerySchema) {}
export class ${n.pascal}IdParamsDto extends createZodDto(z.strictObject({ id: z.uuid() })) {}
`;

export const apiMappers = (n) => `/**
 * Maps \`${n.snakePlural}\` rows to API responses.
 */
import type { ${n.pascal}Row } from '@groundwork/db';
import type { ${n.pascal} } from '@groundwork/shared';

export function to${n.pascal}(row: ${n.pascal}Row): ${n.pascal} {
  return {
    id: row.id,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
`;

export const apiRepository = (n) => `/**
 * Persistence for \`${n.snakePlural}\`. Every query is scoped to an owner.
 */
import { Injectable } from '@nestjs/common';
import { ${n.camelPlural}, type ${n.pascal}Row } from '@groundwork/db';
import { and, eq } from 'drizzle-orm';
import type { DbExecutor } from '../../shared/db/db.service.js';
import {
  afterCursor,
  newestFirst,
  toPage,
  type CursorPosition,
} from '../../shared/pagination/cursor.js';

@Injectable()
export class ${n.pascalPlural}Repository {
  async create(db: DbExecutor, input: { ownerId: string; name: string }): Promise<${n.pascal}Row> {
    const [row] = await db.insert(${n.camelPlural}).values(input).returning();
    if (row === undefined) {
      throw new Error('${n.pascal} insert returned no row.');
    }
    return row;
  }

  async findOwned(db: DbExecutor, ownerId: string, id: string): Promise<${n.pascal}Row | null> {
    const [row] = await db
      .select()
      .from(${n.camelPlural})
      .where(and(eq(${n.camelPlural}.id, id), eq(${n.camelPlural}.ownerId, ownerId)))
      .limit(1);
    return row ?? null;
  }

  async listOwned(
    db: DbExecutor,
    ownerId: string,
    page: { limit: number; after: CursorPosition | null },
  ): Promise<{ items: ${n.pascal}Row[]; nextCursor: string | null }> {
    const rows = await db
      .select()
      .from(${n.camelPlural})
      .where(
        and(
          eq(${n.camelPlural}.ownerId, ownerId),
          page.after === null ? undefined : afterCursor(${n.camelPlural}, page.after),
        ),
      )
      .orderBy(...newestFirst(${n.camelPlural}))
      .limit(page.limit + 1);
    return toPage(rows, page.limit);
  }
}
`;

export const createAction = (n) => `/**
 * Creates a ${n.title} owned by the current user. It has no expected
 * failure mode, so it returns the value directly instead of a Result.
 */
import { Injectable } from '@nestjs/common';
import type { Create${n.pascal}Request, ${n.pascal} } from '@groundwork/shared';
import { DbService } from '../../../shared/db/db.service.js';
import { to${n.pascal} } from '../${n.kebabPlural}.mappers.js';
import { ${n.pascalPlural}Repository } from '../${n.kebabPlural}.repository.js';

@Injectable()
export class Create${n.pascal}Action {
  constructor(
    private readonly db: DbService,
    private readonly ${n.camelPlural}: ${n.pascalPlural}Repository,
  ) {}

  async execute(ownerId: string, input: Create${n.pascal}Request): Promise<${n.pascal}> {
    const row = await this.${n.camelPlural}.create(this.db.client, { ownerId, name: input.name });
    return to${n.pascal}(row);
  }
}
`;

export const getAction = (n) => `/**
 * Loads one ${n.title} of the current user. Another user's ${n.title} is
 * reported as not found, never as forbidden, to avoid leaking existence.
 */
import { Injectable } from '@nestjs/common';
import { fail, ok, type ${n.pascal}, type Result } from '@groundwork/shared';
import { DbService } from '../../../shared/db/db.service.js';
import { to${n.pascal} } from '../${n.kebabPlural}.mappers.js';
import { ${n.pascalPlural}Repository } from '../${n.kebabPlural}.repository.js';

@Injectable()
export class Get${n.pascal}Action {
  constructor(
    private readonly db: DbService,
    private readonly ${n.camelPlural}: ${n.pascalPlural}Repository,
  ) {}

  async execute(ownerId: string, id: string): Promise<Result<${n.pascal}, '${n.snake}.not_found'>> {
    const row = await this.${n.camelPlural}.findOwned(this.db.client, ownerId, id);
    return row === null ? fail('${n.snake}.not_found') : ok(to${n.pascal}(row));
  }
}
`;

export const listAction = (n) => `/**
 * Lists the current user's ${n.title} records, newest first, by cursor.
 */
import { Injectable } from '@nestjs/common';
import {
  fail,
  ok,
  type CursorPageQuery,
  type ${n.pascal}ListResponse,
  type Result,
} from '@groundwork/shared';
import { DbService } from '../../../shared/db/db.service.js';
import { decodeCursor } from '../../../shared/pagination/cursor.js';
import { to${n.pascal} } from '../${n.kebabPlural}.mappers.js';
import { ${n.pascalPlural}Repository } from '../${n.kebabPlural}.repository.js';

@Injectable()
export class List${n.pascalPlural}Action {
  constructor(
    private readonly db: DbService,
    private readonly ${n.camelPlural}: ${n.pascalPlural}Repository,
  ) {}

  async execute(
    ownerId: string,
    query: CursorPageQuery,
  ): Promise<Result<${n.pascal}ListResponse, 'generic.bad_request'>> {
    const after = query.cursor === undefined ? null : decodeCursor(query.cursor);
    if (query.cursor !== undefined && after === null) {
      return fail('generic.bad_request');
    }
    const page = await this.${n.camelPlural}.listOwned(this.db.client, ownerId, { limit: query.limit, after });
    return ok({ items: page.items.map(to${n.pascal}), nextCursor: page.nextCursor });
  }
}
`;

export const controller = (n) => `/**
 * ${n.title} endpoints for the signed-in user.
 */
import { Body, Controller, Get, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';
import { ApiErrors } from '../../shared/errors/api-errors.decorator.js';
import { DomainException } from '../../shared/errors/domain-exception.js';
import { Authenticated } from '../auth/session/authenticated.decorator.js';
import { CurrentSession } from '../auth/session/current-session.decorator.js';
import type { AuthenticatedSession } from '../auth/session/session.types.js';
import { Create${n.pascal}Action } from './actions/create-${n.kebab}.action.js';
import { Get${n.pascal}Action } from './actions/get-${n.kebab}.action.js';
import { List${n.pascalPlural}Action } from './actions/list-${n.kebabPlural}.action.js';
import {
  Create${n.pascal}RequestDto,
  ${n.pascal}Dto,
  ${n.pascal}IdParamsDto,
  ${n.pascal}ListQueryDto,
  ${n.pascal}ListResponseDto,
} from './${n.kebabPlural}.schemas.js';

@ApiTags('${n.pascalPlural}')
@Authenticated()
@Controller('${n.kebabPlural}')
export class ${n.pascalPlural}Controller {
  constructor(
    private readonly createAction: Create${n.pascal}Action,
    private readonly getAction: Get${n.pascal}Action,
    private readonly listAction: List${n.pascalPlural}Action,
  ) {}

  @Get()
  @ZodResponse({ status: HttpStatus.OK, type: ${n.pascal}ListResponseDto })
  @ApiErrors('generic.bad_request')
  async list(
    @CurrentSession() session: AuthenticatedSession,
    @Query() query: ${n.pascal}ListQueryDto,
  ): Promise<${n.pascal}ListResponseDto> {
    const result = await this.listAction.execute(session.userId, query);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
    return result.value;
  }

  @Post()
  @ZodResponse({ status: HttpStatus.CREATED, type: ${n.pascal}Dto })
  async create(
    @CurrentSession() session: AuthenticatedSession,
    @Body() body: Create${n.pascal}RequestDto,
  ): Promise<${n.pascal}Dto> {
    return this.createAction.execute(session.userId, body);
  }

  @Get(':id')
  @ZodResponse({ status: HttpStatus.OK, type: ${n.pascal}Dto })
  @ApiErrors('${n.snake}.not_found')
  async get(
    @CurrentSession() session: AuthenticatedSession,
    @Param() params: ${n.pascal}IdParamsDto,
  ): Promise<${n.pascal}Dto> {
    const result = await this.getAction.execute(session.userId, params.id);
    if (!result.ok) {
      throw new DomainException(result.error);
    }
    return result.value;
  }
}
`;

export const nestModule = (n) => `/**
 * ${n.title} feature: wires the controller, repository, and actions.
 * Imports AuthModule for the session guard behind \`@Authenticated()\`.
 */
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module.js';
import { Create${n.pascal}Action } from './actions/create-${n.kebab}.action.js';
import { Get${n.pascal}Action } from './actions/get-${n.kebab}.action.js';
import { List${n.pascalPlural}Action } from './actions/list-${n.kebabPlural}.action.js';
import { ${n.pascalPlural}Controller } from './${n.kebabPlural}.controller.js';
import { ${n.pascalPlural}Repository } from './${n.kebabPlural}.repository.js';

@Module({
  imports: [AuthModule],
  controllers: [${n.pascalPlural}Controller],
  providers: [${n.pascalPlural}Repository, Create${n.pascal}Action, Get${n.pascal}Action, List${n.pascalPlural}Action],
})
export class ${n.pascalPlural}Module {}
`;

export const integrationTest = (n) => `/**
 * ${n.title} endpoints on the real test database: creation, validation,
 * cursor pagination, ownership isolation, and authentication.
 */
import { ${n.camelPlural} } from '@groundwork/db';
import {
  ErrorResponseSchema,
  ${n.pascal}ListResponseSchema,
  ${n.pascal}Schema,
} from '@groundwork/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createUser, DEFAULT_PASSWORD } from '../helpers/fixtures.js';
import { createTestApp, type TestApp } from '../helpers/test-app.js';

const BASE = '/api/v1/${n.kebabPlural}';

describe('${n.kebabPlural}', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await t.reset();
  });

  afterAll(async () => {
    await t.close();
  });

  async function signedInAgent(email = 'ada@example.com') {
    await createUser(t.db, { email });
    const agent = t.agent();
    await agent.post('/api/v1/auth/login').send({ email, password: DEFAULT_PASSWORD });
    return agent;
  }

  it('creates a ${n.title} owned by the current user', async () => {
    const agent = await signedInAgent();

    const response = await agent.post(BASE).send({ name: '  First  ' });

    expect(response.status).toBe(201);
    const body = ${n.pascal}Schema.parse(response.body);
    expect(body.name).toBe('First');
    const [row] = await t.db.select().from(${n.camelPlural});
    expect(row).toMatchObject({ id: body.id, name: 'First' });
  });

  it('rejects an invalid payload without writing', async () => {
    const agent = await signedInAgent();

    const response = await agent.post(BASE).send({ name: '' });

    expect(response.status).toBe(400);
    expect(ErrorResponseSchema.parse(response.body).code).toBe('generic.validation_failed');
    expect(await t.db.select().from(${n.camelPlural})).toHaveLength(0);
  });

  it('paginates newest first with an opaque cursor', async () => {
    const agent = await signedInAgent();
    for (const name of ['a', 'b', 'c']) {
      await agent.post(BASE).send({ name });
    }

    const first = ${n.pascal}ListResponseSchema.parse((await agent.get(BASE).query({ limit: 2 })).body);
    const second = ${n.pascal}ListResponseSchema.parse(
      (await agent.get(BASE).query({ limit: 2, cursor: first.nextCursor })).body,
    );

    expect(first.items.map((item) => item.name)).toEqual(['c', 'b']);
    expect(second.items.map((item) => item.name)).toEqual(['a']);
    expect(second.nextCursor).toBeNull();
  });

  it('rejects a malformed cursor', async () => {
    const agent = await signedInAgent();

    const response = await agent.get(BASE).query({ cursor: 'garbage' });

    expect(response.status).toBe(400);
  });

  it("hides another user's ${n.title} behind a 404", async () => {
    const owner = await signedInAgent('owner@example.com');
    const created = ${n.pascal}Schema.parse((await owner.post(BASE).send({ name: 'private' })).body);
    const intruder = await signedInAgent('intruder@example.com');

    const response = await intruder.get(\`\${BASE}/\${created.id}\`);
    const list = ${n.pascal}ListResponseSchema.parse((await intruder.get(BASE)).body);

    expect(response.status).toBe(404);
    expect(ErrorResponseSchema.parse(response.body).code).toBe('${n.snake}.not_found');
    expect(list.items).toHaveLength(0);
    expect(${n.pascal}Schema.parse((await owner.get(\`\${BASE}/\${created.id}\`)).body).name).toBe('private');
  });

  it('requires a session', async () => {
    expect((await t.http().get(BASE)).status).toBe(401);
  });
});
`;
