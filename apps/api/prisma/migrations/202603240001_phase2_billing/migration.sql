-- AlterTable
ALTER TABLE "Laboratory" ADD COLUMN "stripeCustomerId" TEXT;

-- AlterTable
ALTER TABLE "Plan"
  ADD COLUMN "amountCents" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "billingInterval" TEXT NOT NULL DEFAULT 'month',
  ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'usd',
  ADD COLUMN "stripePriceId" TEXT,
  ADD COLUMN "trialDays" INTEGER NOT NULL DEFAULT 15;

-- AlterTable
ALTER TABLE "Subscription"
  ADD COLUMN "currentPeriodEndAt" TIMESTAMP(3),
  ADD COLUMN "currentPeriodStartAt" TIMESTAMP(3),
  ADD COLUMN "stripeCustomerId" TEXT,
  ADD COLUMN "stripeSubscriptionId" TEXT,
  ADD COLUMN "trialEndsAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Entitlement" (
  "id" TEXT NOT NULL,
  "laboratoryId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "key" TEXT NOT NULL,
  "value" INTEGER NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'subscription',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "eventId" TEXT NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Laboratory_stripeCustomerId_key" ON "Laboratory"("stripeCustomerId");
CREATE UNIQUE INDEX "Plan_stripePriceId_key" ON "Plan"("stripePriceId");
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");
CREATE INDEX "Subscription_laboratoryId_createdAt_idx" ON "Subscription"("laboratoryId", "createdAt");
CREATE UNIQUE INDEX "Entitlement_laboratoryId_key_key" ON "Entitlement"("laboratoryId", "key");
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_laboratoryId_fkey" FOREIGN KEY ("laboratoryId") REFERENCES "Laboratory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
