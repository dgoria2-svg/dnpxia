export type MembershipRole = 'OWNER' | 'ADMIN' | 'STAFF' | 'MEMBER';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED';

export type LicenseStatus = 'ACTIVE' | 'SUSPENDED' | 'REVOKED' | 'EXPIRED';

export interface PricingPlan {
  code: string;
  name: string;
  description: string | null;
  amountCents: number;
  currency: string;
  billingInterval: string;
  trialDays: number;
  maxDevicesPerUser: number;
}

export interface Entitlement {
  key: string;
  value: number;
  active: boolean;
}
