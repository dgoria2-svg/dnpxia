import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import sensible from '@fastify/sensible';
import Fastify from 'fastify';
import { getEnv } from './lib/env.js';
import { accessRoutes } from './routes/access.js';
import { authRoutes } from './routes/auth.js';
import { billingRoutes } from './routes/billing.js';
import { healthRoutes } from './routes/health.js';
import { pricingRoutes } from './routes/pricing.js';
import { webhooksRoutes } from './routes/webhooks.js';

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
  app.register(accessRoutes);
  app.register(pricingRoutes);
  app.register(billingRoutes);
  app.register(webhooksRoutes);

  return app;
}
