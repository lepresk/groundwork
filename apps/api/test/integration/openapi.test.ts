import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { configureApp } from '../../src/app.factory.js';
import { AppModule } from '../../src/app.module.js';

describe('OpenAPI document', () => {
  it('documents every auth route with its error responses', async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    const app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, { swagger: true });
    await app.init();

    const response = await request(app.getHttpServer()).get('/api/v1/docs-json');
    await app.close();

    expect(response.status).toBe(200);
    expect(Object.keys(response.body.paths)).toEqual(
      expect.arrayContaining([
        '/api/v1/auth/login',
        '/api/v1/auth/two-factor/enable',
        '/health/ready',
      ]),
    );
    expect(response.body.paths['/api/v1/auth/login'].post.responses).toHaveProperty('401');
  });
});
