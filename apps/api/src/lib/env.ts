import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(8),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_SUCCESS_URL: z.string().url().default('http://localhost:3000/dashboard?billing=success'),
  STRIPE_CANCEL_URL: z.string().url().default('http://localhost:3000/dashboard?billing=cancel'),
});

export function getEnv() {
  return envSchema.parse(process.env);
}
