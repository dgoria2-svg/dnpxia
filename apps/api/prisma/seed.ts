import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const starterPlan = await prisma.plan.upsert({
    where: { code: 'starter' },
    update: {
      description: 'Plan Starter con Stripe y trial de 15 días.',
      amountCents: 4900,
      currency: 'usd',
      billingInterval: 'month',
      trialDays: 15,
      maxDevicesPerUser: 3,
      isActive: true,
    },
    create: {
      code: 'starter',
      name: 'Starter',
      description: 'Plan Starter con Stripe y trial de 15 días.',
      amountCents: 4900,
      currency: 'usd',
      billingInterval: 'month',
      trialDays: 15,
      maxDevicesPerUser: 3,
      stripePriceId: 'price_starter_placeholder',
      isActive: true,
    },
  });

  const proPlan = await prisma.plan.upsert({
    where: { code: 'pro' },
    update: {
      description: 'Plan Pro para laboratorios con más capacidad.',
      amountCents: 9900,
      currency: 'usd',
      billingInterval: 'month',
      trialDays: 15,
      maxDevicesPerUser: 10,
      isActive: true,
    },
    create: {
      code: 'pro',
      name: 'Pro',
      description: 'Plan Pro para laboratorios con más capacidad.',
      amountCents: 9900,
      currency: 'usd',
      billingInterval: 'month',
      trialDays: 15,
      maxDevicesPerUser: 10,
      stripePriceId: 'price_pro_placeholder',
      isActive: true,
    },
  });

  const laboratory = await prisma.laboratory.upsert({
    where: { slug: 'vision-demo' },
    update: {
      trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
    },
    create: {
      name: 'Vision Demo Lab',
      slug: 'vision-demo',
      trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
    },
  });

  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  const user = await prisma.user.upsert({
    where: { email: 'owner@dnpxia.local' },
    update: {},
    create: {
      email: 'owner@dnpxia.local',
      fullName: 'Initial Owner',
      passwordHash,
      maxDevices: 3,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_laboratoryId: {
        userId: user.id,
        laboratoryId: laboratory.id,
      },
    },
    update: {},
    create: {
      userId: user.id,
      laboratoryId: laboratory.id,
      role: 'OWNER',
    },
  });

  const subscription = await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: 'sub_seed_vision_demo',
    },
    update: {
      planId: starterPlan.id,
      status: 'TRIAL',
      startsAt: new Date(),
      trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      currentPeriodEndAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      stripeCustomerId: 'cus_seed_vision_demo',
    },
    create: {
      laboratoryId: laboratory.id,
      planId: starterPlan.id,
      status: 'TRIAL',
      startsAt: new Date(),
      trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      currentPeriodStartAt: new Date(),
      currentPeriodEndAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
      stripeSubscriptionId: 'sub_seed_vision_demo',
      stripeCustomerId: 'cus_seed_vision_demo',
    },
  });

  await prisma.entitlement.upsert({
    where: {
      laboratoryId_key: {
        laboratoryId: laboratory.id,
        key: 'devices.max',
      },
    },
    update: {
      value: starterPlan.maxDevicesPerUser,
      subscriptionId: subscription.id,
      active: true,
    },
    create: {
      laboratoryId: laboratory.id,
      subscriptionId: subscription.id,
      key: 'devices.max',
      value: starterPlan.maxDevicesPerUser,
      active: true,
    },
  });

  console.log('Seed OK', { starterPlan: starterPlan.code, proPlan: proPlan.code, subscription: subscription.id });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
