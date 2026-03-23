import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plan = await prisma.plan.upsert({
    where: { code: 'starter' },
    update: {},
    create: {
      code: 'starter',
      name: 'Starter',
      description: 'Plan inicial para laboratorios en trial o primeras pruebas.',
      maxDevicesPerUser: 2,
    },
  });

  const laboratory = await prisma.laboratory.upsert({
    where: { slug: 'vision-demo' },
    update: {},
    create: {
      name: 'Vision Demo Lab',
      slug: 'vision-demo',
      trialEndsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
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
      maxDevices: 2,
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

  const existingSubscription = await prisma.subscription.findFirst({
    where: { laboratoryId: laboratory.id, planId: plan.id },
  });

  if (!existingSubscription) {
    await prisma.subscription.create({
      data: {
        laboratoryId: laboratory.id,
        planId: plan.id,
        status: 'TRIAL',
        startsAt: new Date(),
        endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      },
    });
  }
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
