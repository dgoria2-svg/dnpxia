import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { buildApp } from './app.js';

const requiredEnv = {
  PORT: '4000',
  DATABASE_URL: 'postgresql://dnpxia:dnpxia@localhost:5432/dnpxia?schema=public',
  JWT_SECRET: 'change-me-super-secret',
  CORS_ORIGIN: 'http://localhost:3000',
};

beforeAll(() => {
  Object.assign(process.env, requiredEnv);
});

afterAll(() => {
  for (const key of Object.keys(requiredEnv)) {
    delete process.env[key];
  }
});

describe('health route', () => {
  it('returns service health', async () => {
    const app = buildApp();
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      status: 'ok',
      service: 'dnpxia-api',
    });

    await app.close();
  });
});
