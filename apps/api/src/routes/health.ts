import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({
    status: 'ok' as const,
    service: 'dnpxia-api' as const,
    timestamp: new Date().toISOString(),
  }));
}
