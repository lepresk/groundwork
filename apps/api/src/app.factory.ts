/**
 * Applies the global HTTP configuration. Shared by `main.ts` and the
 * integration test harness so tests exercise the exact production pipeline.
 */
import { type INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SESSION_COOKIE_NAME } from '@groundwork/shared';
import { Logger } from 'nestjs-pino';
import { ZodSerializerInterceptor, ZodValidationPipe, cleanupOpenApiDoc } from 'nestjs-zod';

export const API_PREFIX = 'api/v1';
export const HEALTH_ROUTES = ['health/live', 'health/ready'];
export const SESSION_SECURITY_SCHEME = 'session';

export interface ConfigureAppOptions {
  readonly swagger: boolean;
}

export function configureApp(app: INestApplication, options: ConfigureAppOptions): void {
  app.useLogger(app.get(Logger));
  (app as NestExpressApplication).disable('x-powered-by');

  // Every request body, query, and param is validated against its Zod DTO,
  // and every response is re-validated against the DTO declared with
  // @ZodResponse, so leaked fields become a 500 instead of a silent leak.
  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalInterceptors(new ZodSerializerInterceptor(app.get(Reflector)));

  app.setGlobalPrefix(API_PREFIX, { exclude: HEALTH_ROUTES });

  if (options.swagger) {
    const config = new DocumentBuilder()
      .setTitle('Groundwork API')
      .setVersion('0.1.0')
      .addCookieAuth(SESSION_COOKIE_NAME, { type: 'apiKey', in: 'cookie' }, SESSION_SECURITY_SCHEME)
      .build();
    const document = cleanupOpenApiDoc(SwaggerModule.createDocument(app, config));
    SwaggerModule.setup(`${API_PREFIX}/docs`, app, document, {
      jsonDocumentUrl: `${API_PREFIX}/docs-json`,
    });
  }
}
