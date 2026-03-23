import bcrypt from 'bcryptjs';
import { MembershipRole, type AuthUser } from '@dnpxia/shared';
import { User } from '@prisma/client';
import { prisma } from './prisma.js';

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function toAuthUser(user: User): Promise<AuthUser> {
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { laboratory: true },
  });

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    memberships: memberships.map((membership) => ({
      laboratoryId: membership.laboratoryId,
      laboratoryName: membership.laboratory.name,
      role: membership.role as MembershipRole,
    })),
  };
}
