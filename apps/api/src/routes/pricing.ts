import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma.js';

export async function pricingRoutes(app: FastifyInstance) {
  app.get('/pricing', async () => {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ amountCents: 'asc' }],
      select: {
        code: true,
        name: true,
        description: true,
        amountCents: true,
        currency: true,
        billingInterval: true,
        trialDays: true,
        maxDevicesPerUser: true,
      },
    });

    return { plans };
  });
}
