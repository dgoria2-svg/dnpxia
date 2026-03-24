import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { getEnv } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { stripe } from '../lib/stripe.js';

const checkoutSchema = z.object({
  laboratoryId: z.string().min(1),
  planCode: z.string().min(1),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

const portalSchema = z.object({
  laboratoryId: z.string().min(1),
  returnUrl: z.string().url().optional(),
});

export async function billingRoutes(app: FastifyInstance) {
  const env = getEnv();

  app.post('/billing/checkout-session', async (request, reply) => {
    await request.jwtVerify();
    const userId = String((request.user as { sub: string }).sub);
    const input = checkoutSchema.parse(request.body);

    const membership = await prisma.membership.findFirst({
      where: { laboratoryId: input.laboratoryId, userId },
      include: { laboratory: true },
    });

    if (!membership) {
      return reply.forbidden('User is not a member of this laboratory.');
    }

    const plan = await prisma.plan.findUnique({ where: { code: input.planCode } });
    if (!plan || !plan.isActive || !plan.stripePriceId) {
      return reply.badRequest('Plan is not available for billing.');
    }

    let customerId = membership.laboratory.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: (request.user as { email?: string }).email,
        metadata: { laboratoryId: membership.laboratoryId },
        name: membership.laboratory.name,
      });

      customerId = customer.id;
      await prisma.laboratory.update({
        where: { id: membership.laboratoryId },
        data: { stripeCustomerId: customerId },
      });
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      success_url: input.successUrl ?? env.STRIPE_SUCCESS_URL,
      cancel_url: input.cancelUrl ?? env.STRIPE_CANCEL_URL,
      subscription_data: {
        trial_period_days: plan.trialDays,
        metadata: {
          laboratoryId: membership.laboratoryId,
          planCode: plan.code,
        },
      },
      metadata: {
        laboratoryId: membership.laboratoryId,
        planCode: plan.code,
      },
    });

    return { checkoutUrl: checkoutSession.url };
  });

  app.post('/billing/portal-session', async (request, reply) => {
    await request.jwtVerify();
    const userId = String((request.user as { sub: string }).sub);
    const input = portalSchema.parse(request.body);

    const membership = await prisma.membership.findFirst({
      where: { laboratoryId: input.laboratoryId, userId },
      include: { laboratory: true },
    });

    if (!membership || !membership.laboratory.stripeCustomerId) {
      return reply.badRequest('Billing portal is not available for this laboratory.');
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.laboratory.stripeCustomerId,
      return_url: input.returnUrl ?? env.STRIPE_SUCCESS_URL,
    });

    return { url: portalSession.url };
  });

  app.get('/subscriptions/:laboratoryId', async (request, reply) => {
    await request.jwtVerify();
    const userId = String((request.user as { sub: string }).sub);
    const params = z.object({ laboratoryId: z.string().min(1) }).parse(request.params);

    const membership = await prisma.membership.findFirst({
      where: { laboratoryId: params.laboratoryId, userId },
    });

    if (!membership) {
      return reply.forbidden('User is not a member of this laboratory.');
    }

    const subscription = await prisma.subscription.findFirst({
      where: { laboratoryId: params.laboratoryId },
      orderBy: { createdAt: 'desc' },
      include: { plan: true },
    });

    const entitlements = await prisma.entitlement.findMany({
      where: { laboratoryId: params.laboratoryId, active: true },
      orderBy: { key: 'asc' },
    });

    return {
      subscription,
      entitlements,
    };
  });
}
