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

type AccessReason =
  | 'trial_expired'
  | 'subscription_inactive'
  | 'device_limit_reached'
  | 'membership_not_found'
  | 'lab_inactive'
  | 'lab_selection_required';

type AccessDecision = {
  allowed: boolean;
  reason?: AccessReason;
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

async function listUserMemberships(userId: string) {
  return prisma.membership.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
    include: { laboratory: true },
  });
}

function toMembershipSummary(membership: Awaited<ReturnType<typeof listUserMemberships>>[number]) {
  return {
    labId: membership.laboratoryId,
    labName: membership.laboratory.name,
    labStatus: membership.laboratory.status,
    createdAt: membership.createdAt.toISOString(),
  };
}

async function resolveMembershipForAccess(userId: string, labId?: string) {
  const memberships = await listUserMemberships(userId);

  if (labId) {
    const membership = memberships.find((item) => item.laboratoryId === labId) ?? null;
    return {
      memberships,
      membership,
      reason: membership ? undefined : ('membership_not_found' as const),
    };
  }

  if (memberships.length === 0) {
    return {
      memberships,
      membership: null,
      reason: 'membership_not_found' as const,
    };
  }

  if (memberships.length > 1) {
    return {
      memberships,
      membership: null,
      reason: 'lab_selection_required' as const,
    };
  }

  return {
    memberships,
    membership: memberships[0],
    reason: undefined,
  };
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
    const memberships = await listUserMemberships(userId);

    return {
      user: await toAuthUser(user),
      memberships: memberships.map(toMembershipSummary),
    };
  });

  app.get('/me/access', async (request, reply) => {
    await request.jwtVerify();
    const userId = String((request.user as { sub: string }).sub);
    const query = meAccessQuerySchema.parse(request.query);

    const selection = await resolveMembershipForAccess(userId, query.labId);
    const memberships = selection.memberships.map(toMembershipSummary);

    if (!selection.membership) {
      if (selection.reason === 'lab_selection_required') {
        return {
          allowed: false,
          reason: 'lab_selection_required' as const,
          memberships,
        };
      }

      return reply.code(403).send({
        allowed: false,
        reason: 'membership_not_found' as const,
        memberships,
      });
    }

    const access = await getAccessDecision(userId, selection.membership.laboratoryId);

    return {
      allowed: access.allowed,
      scopeType: 'lab' as const,
      scopeId: selection.membership.laboratoryId,
      subscriptionStatus: access.subscriptionStatus ?? 'canceled',
      trialEndsAt: access.trialEndsAt,
      maxDevices: access.maxDevices ?? 0,
      activeDevices: access.activeDevices ?? 0,
      reason: access.reason,
      memberships,
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
        subscriptionStatus: access.subscriptionStatus ?? 'canceled',
        trialEndsAt: access.trialEndsAt ?? null,
        maxDevices: access.maxDevices ?? 0,
        activeDevices: access.activeDevices ?? 0,
      };
    }

    const maxDevices = access.maxDevices ?? 0;
    const activeDevices = access.activeDevices ?? 0;

    const existingDevice = await prisma.device.findFirst({
      where: {
        userId: input.userId,
        laboratoryId: input.labId,
        deviceFingerprint: input.deviceFingerprint,
      },
    });

    const alreadyActive = existingDevice?.isActive === true;

    if (!alreadyActive && activeDevices >= maxDevices) {
      return {
        allowed: false,
        reason: 'device_limit_reached' as const,
        subscriptionStatus: access.subscriptionStatus ?? 'canceled',
        trialEndsAt: access.trialEndsAt ?? null,
        maxDevices,
        activeDevices,
      };
    }

    if (existingDevice) {
      await prisma.device.update({
        where: { id: existingDevice.id },
        data: {
          deviceName: input.deviceName,
          platform: input.platform,
          appVersion: input.appVersion,
          isActive: true,
        },
      });
    } else {
      await prisma.device.create({
        data: {
          userId: input.userId,
          laboratoryId: input.labId,
          deviceFingerprint: input.deviceFingerprint,
          deviceName: input.deviceName,
          platform: input.platform,
          appVersion: input.appVersion,
          isActive: true,
        },
      });
    }

    return {
      allowed: true,
      subscriptionStatus: access.subscriptionStatus ?? 'canceled',
      trialEndsAt: access.trialEndsAt ?? null,
      maxDevices,
      activeDevices: alreadyActive ? activeDevices : activeDevices + 1,
    };
  });
}
