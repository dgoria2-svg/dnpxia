import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { getEnv } from './lib/env.js';
import { authRoutes } from './routes/auth.js';
import { healthRoutes } from './routes/health.js';

export function buildApp() {
  const env = getEnv();
  const app = Fastify({ logger: true });

  app.register(sensible);
  app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });
  app.register(jwt, {
    secret: env.JWT_SECRET,
  });

  app.register(healthRoutes);
  app.register(authRoutes);

  return app;
}
