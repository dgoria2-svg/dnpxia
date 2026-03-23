import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

type MembershipRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'MEMBER';

type AuthUser = {
  id: string;
  email: string;
  fullName: string;
  memberships: Array<{
    laboratoryId: string;
    laboratoryName: string;
    role: MembershipRole;
  }>;
};

type AuthUserSource = {
  id: string;
  email: string;
  fullName: string;
};

type MembershipWithLaboratory = {
  laboratoryId: string;
  laboratory: {
    name: string;
  };
  role: MembershipRole;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function toAuthUser(user: AuthUserSource): Promise<AuthUser> {
  const memberships = (await prisma.membership.findMany({
    where: { userId: user.id },
    include: { laboratory: true },
  })) as MembershipWithLaboratory[];

  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    memberships: memberships.map((membership: MembershipWithLaboratory) => ({
      laboratoryId: membership.laboratoryId,
      laboratoryName: membership.laboratory.name,
      role: membership.role,
    })),
  };
}