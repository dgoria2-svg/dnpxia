import { SubscriptionStatus } from '@prisma/client';
import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { toAuthUser } from '../lib/auth.js';
import { prisma } from '../lib/prisma.js';

const trialDurationDays = 15;
const trialMaxDevices = 1;
const fallbackPaidMaxDevices = 3;

const meAccessQuerySchema = z.object({
  labId: z.string().min(1).optional(),
});

const startTrialSchema = z.object({
  labId: z.string().min(1),
  planCode: z.string().min(1).optional(),
});

const validateDeviceSchema = z.object({
  userId: z.string().min(1),
  labId: z.string().min(1),
  deviceFingerprint: z.string().min(1),
  deviceName: z.string().min(1),
  platform: z.string().min(1),
  appVersion: z.string().min(1),
});

type AccessDecision = {
  allowed: boolean;
  reason?:
    | 'trial_expired'
    | 'subscription_inactive'
    | 'device_limit_reached'
    | 'membership_not_found'
    | 'lab_inactive';
  subscriptionStatus?: 'trial' | 'active' | 'past_due' | 'canceled';
  trialEndsAt?: string | null;
  maxDevices?: number;
  activeDevices?: number;
};

function toContractStatus(status: SubscriptionStatus): AccessDecision['subscriptionStatus'] {
  if (status === 'TRIAL') return 'trial';
  if (status === 'ACTIVE') return 'active';
  if (status === 'PAST_DUE') return 'past_due';
  return 'canceled';
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

async function getAccessDecision(userId: string, labId: string): Promise<AccessDecision> {
  const membership = await prisma.membership.findFirst({
    where: { userId, laboratoryId: labId },
    include: { laboratory: true },
  });

  if (!membership) {
    return { allowed: false, reason: 'membership_not_found' };
  }

  if (membership.laboratory.status !== 'active') {
    return { allowed: false, reason: 'lab_inactive' };
  }

  const subscription = await prisma.subscription.findFirst({
    where: { laboratoryId: labId },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  });

  if (!subscription) {
    return { allowed: false, reason: 'subscription_inactive' };
  }

  const subscriptionStatus = toContractStatus(subscription.status);
  const activeDevices = await prisma.device.count({
    where: {
      userId,
      laboratoryId: labId,
      isActive: true,
    },
  });

  const maxDevices =
    subscription.status === 'TRIAL'
      ? trialMaxDevices
      : subscription.plan.maxDevicesPerUser || fallbackPaidMaxDevices;

  const trialEndsAt = subscription.trialEndsAt?.toISOString() ?? null;

  if (subscription.status === 'TRIAL') {
    if (subscription.trialEndsAt && subscription.trialEndsAt.getTime() < Date.now()) {
      return {
        allowed: false,
        reason: 'trial_expired',
        subscriptionStatus,
        trialEndsAt,
        maxDevices,
        activeDevices,
      };
    }

    return {
      allowed: true,
      subscriptionStatus,
      trialEndsAt,
      maxDevices,
      activeDevices,
    };
  }

  if (subscription.status !== 'ACTIVE' && subscription.status !== 'PAST_DUE') {
    return {
      allowed: false,
      reason: 'subscription_inactive',
      subscriptionStatus,
      trialEndsAt,
      maxDevices,
      activeDevices,
    };
  }

  return {
    allowed: true,
    subscriptionStatus,
    trialEndsAt,
    maxDevices,
    activeDevices,
  };
}

export async function accessRoutes(app: FastifyInstance) {
  app.get('/me', async (request) => {
    await request.jwtVerify();
    const userId = String((request.user as { sub: string }).sub);
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

    return { user: await toAuthUser(user) };
  });

  app.get('/me/access', async (request, reply) => {
    await request.jwtVerify();
    const userId = String((request.user as { sub: string }).sub);
    const query = meAccessQuerySchema.parse(request.query);

    const membership = query.labId
      ? await prisma.membership.findFirst({
          where: { userId, laboratoryId: query.labId },
          include: { laboratory: true },
        })
      : await prisma.membership.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' },
          include: { laboratory: true },
        });

    if (!membership) {
      return reply.code(403).send({
        allowed: false,
        reason: 'membership_not_found',
      });
    }

    const access = await getAccessDecision(userId, membership.laboratoryId);

    return {
      allowed: access.allowed,
      scopeType: 'lab' as const,
      scopeId: membership.laboratoryId,
      subscriptionStatus: access.subscriptionStatus ?? 'canceled',
      trialEndsAt: access.trialEndsAt,
      maxDevices: access.maxDevices ?? 0,
      activeDevices: access.activeDevices ?? 0,
      reason: access.reason,
    };
  });

  app.post('/subscriptions/start-trial', async (request, reply) => {
    await request.jwtVerify();
    const userId = String((request.user as { sub: string }).sub);
    const input = startTrialSchema.parse(request.body);

    const membership = await prisma.membership.findFirst({
      where: { userId, laboratoryId: input.labId },
      include: { laboratory: true },
    });

    if (!membership) {
      return reply.code(403).send({ allowed: false, reason: 'membership_not_found' });
    }

    const plan =
      (input.planCode
        ? await prisma.plan.findUnique({ where: { code: input.planCode } })
        : await prisma.plan.findUnique({ where: { code: 'starter' } })) ??
      (await prisma.plan.findFirst({ where: { isActive: true }, orderBy: { createdAt: 'asc' } }));

    if (!plan) {
      return reply.code(400).send({
        allowed: false,
        reason: 'subscription_inactive',
        message: 'No active plan available to start trial.',
      });
    }

    const startsAt = new Date();
    const trialEndsAt = addDays(startsAt, trialDurationDays);

    const existing = await prisma.subscription.findFirst({
      where: { laboratoryId: input.labId },
      orderBy: { createdAt: 'desc' },
    });

    const subscription = existing
      ? await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            status: 'TRIAL',
            planId: plan.id,
            startsAt,
            trialEndsAt,
            currentPeriodStartAt: startsAt,
            currentPeriodEndAt: trialEndsAt,
            canceledAt: null,
            endsAt: null,
          },
        })
      : await prisma.subscription.create({
          data: {
            laboratoryId: input.labId,
            status: 'TRIAL',
            planId: plan.id,
            startsAt,
            trialEndsAt,
            currentPeriodStartAt: startsAt,
            currentPeriodEndAt: trialEndsAt,
          },
        });

    return reply.code(201).send({
      allowed: true,
      subscriptionId: subscription.id,
      subscriptionStatus: 'trial',
      trialEndsAt: subscription.trialEndsAt?.toISOString() ?? null,
      maxDevices: trialMaxDevices,
    });
  });

  app.post('/devices/validate', async (request) => {
    const input = validateDeviceSchema.parse(request.body);

    const access = await getAccessDecision(input.userId, input.labId);
    if (!access.allowed) {
      return {
        allowed: false,
        reason: access.reason ?? 'subscription_inactive',
      };
    }

    const existingDevice = await prisma.device.findUnique({
      where: { deviceIdentifier: input.deviceFingerprint },
    });

    if (
      existingDevice &&
      (existingDevice.userId !== input.userId || existingDevice.laboratoryId !== input.labId)
    ) {
      return {
        allowed: false,
        reason: 'device_limit_reached',
      };
    }

    const activeDevices = access.activeDevices ?? 0;
    const maxDevices = access.maxDevices ?? trialMaxDevices;

    if (!existingDevice && activeDevices >= maxDevices) {
      return {
        allowed: false,
        reason: 'device_limit_reached',
      };
    }

    await prisma.device.upsert({
      where: { deviceIdentifier: input.deviceFingerprint },
      update: {
        userId: input.userId,
        laboratoryId: input.labId,
        deviceName: input.deviceName,
        platform: input.platform,
        lastSeenAt: new Date(),
        isActive: true,
      },
      create: {
        userId: input.userId,
        laboratoryId: input.labId,
        deviceIdentifier: input.deviceFingerprint,
        deviceName: input.deviceName,
        platform: input.platform,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    const updatedActiveDevices = existingDevice ? activeDevices : activeDevices + 1;

    return {
      allowed: true,
      reason: 'ok',
      subscriptionStatus: access.subscriptionStatus,
      deviceRegistered: !existingDevice,
      remainingSlots: Math.max(maxDevices - updatedActiveDevices, 0),
      appVersion: input.appVersion,
    };
  });
}
