export type MembershipRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'MEMBER';
export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED';
export type LicenseStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';

export interface LaboratorySummary {
  id: string;
  name: string;
  slug: string;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  memberships: Array<{
    laboratoryId: string;
    laboratoryName: string;
    role: MembershipRole;
  }>;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface HealthResponse {
  status: 'ok';
  service: 'dnpxia-api';
  timestamp: string;
}
