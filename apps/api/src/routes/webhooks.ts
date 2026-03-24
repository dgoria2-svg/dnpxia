import { FastifyInstance } from 'fastify';
import Stripe from 'stripe';
import { getEnv } from '../lib/env.js';
import { prisma } from '../lib/prisma.js';
import { stripe } from '../lib/stripe.js';

function mapStripeStatus(status: Stripe.Subscription.Status) {
  switch (status) {
    case 'trialing':
      return 'TRIAL';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    default:
      return 'EXPIRED';
  }
}

export async function webhooksRoutes(app: FastifyInstance) {
  const env = getEnv();

  app.post('/webhooks/stripe', async (request, reply) => {
    const signature = request.headers['stripe-signature'];
    if (!signature || typeof signature !== 'string') {
      return reply.badRequest('Missing stripe signature header.');
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        JSON.stringify(request.body ?? {}),
        signature,
        env.STRIPE_WEBHOOK_SECRET,
      );
    } catch (error) {
      return reply.badRequest(`Webhook signature verification failed: ${(error as Error).message}`);
    }

    const alreadyProcessed = await prisma.webhookEvent.findUnique({ where: { eventId: event.id } });
    if (alreadyProcessed) {
      return { received: true, deduplicated: true };
    }

    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const data = event.data.object as Stripe.Subscription;
      const laboratoryId = data.metadata?.laboratoryId;
      const planCode = data.metadata?.planCode;

      if (!laboratoryId || !planCode) {
        await prisma.webhookEvent.create({
          data: {
            provider: 'stripe',
            eventId: event.id,
            eventType: event.type,
            payload: event as unknown as object,
          },
        });

        return { received: true, ignored: true };
      }

      const plan = await prisma.plan.findUnique({ where: { code: planCode } });
      if (!plan) {
        return reply.badRequest(`Unknown plan code: ${planCode}`);
      }

      const periodStart = data.items.data[0]?.current_period_start;
      const periodEnd = data.items.data[0]?.current_period_end;

      const subscription = await prisma.subscription.upsert({
        where: { stripeSubscriptionId: data.id },
        create: {
          laboratoryId,
          planId: plan.id,
          status: mapStripeStatus(data.status) as
            | 'TRIAL'
            | 'ACTIVE'
            | 'PAST_DUE'
            | 'CANCELED'
            | 'EXPIRED',
          startsAt: new Date((data.start_date ?? Math.floor(Date.now() / 1000)) * 1000),
          endsAt: data.ended_at ? new Date(data.ended_at * 1000) : null,
          canceledAt: data.canceled_at ? new Date(data.canceled_at * 1000) : null,
          trialEndsAt: data.trial_end ? new Date(data.trial_end * 1000) : null,
          currentPeriodStartAt: periodStart ? new Date(periodStart * 1000) : null,
          currentPeriodEndAt: periodEnd ? new Date(periodEnd * 1000) : null,
          stripeSubscriptionId: data.id,
          stripeCustomerId: String(data.customer),
        },
        update: {
          status: mapStripeStatus(data.status) as
            | 'TRIAL'
            | 'ACTIVE'
            | 'PAST_DUE'
            | 'CANCELED'
            | 'EXPIRED',
          endsAt: data.ended_at ? new Date(data.ended_at * 1000) : null,
          canceledAt: data.canceled_at ? new Date(data.canceled_at * 1000) : null,
          trialEndsAt: data.trial_end ? new Date(data.trial_end * 1000) : null,
          currentPeriodStartAt: periodStart ? new Date(periodStart * 1000) : null,
          currentPeriodEndAt: periodEnd ? new Date(periodEnd * 1000) : null,
          stripeCustomerId: String(data.customer),
          planId: plan.id,
        },
      });

      await prisma.entitlement.upsert({
        where: {
          laboratoryId_key: {
            laboratoryId,
            key: 'devices.max',
          },
        },
        update: {
          value: plan.maxDevicesPerUser,
          active: subscription.status !== 'CANCELED' && subscription.status !== 'EXPIRED',
          subscriptionId: subscription.id,
        },
        create: {
          laboratoryId,
          subscriptionId: subscription.id,
          key: 'devices.max',
          value: plan.maxDevicesPerUser,
          active: true,
        },
      });

      await prisma.laboratory.update({
        where: { id: laboratoryId },
        data: { stripeCustomerId: String(data.customer) },
      });
    }

    await prisma.webhookEvent.create({
      data: {
        provider: 'stripe',
        eventId: event.id,
        eventType: event.type,
        payload: event as unknown as object,
      },
    });

    return { received: true };
  });
}
