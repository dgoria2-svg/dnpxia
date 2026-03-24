# DNPXIA

Base inicial de DNPXIA como monorepo para una plataforma SaaS multi-tenant de óptica/salud visual.

## Stack elegido

- **Monorepo:** pnpm workspaces + Turborepo.
- **Web:** Next.js 15 + React 19 + TypeScript.
- **API:** Fastify + Prisma + PostgreSQL.
- **Billing:** Stripe Checkout + Stripe Billing Portal + Webhooks.
- **Shared contracts:** paquete TypeScript reutilizable para tipos de dominio.

## FASE 2 implementada (billing y suscripciones)

Esta fase incluye:

- Pricing público por endpoint `GET /pricing`.
- Checkout de Stripe para altas/cambios de plan: `POST /billing/checkout-session`.
- Billing portal para autogestión: `POST /billing/portal-session`.
- Trial de 15 días por plan (`trialDays` en `Plan`).
- Persistencia de suscripciones con estado, periodos y referencias Stripe.
- Entitlements por laboratorio (`devices.max`) derivados del plan.
- Webhook Stripe idempotente: `POST /webhooks/stripe`.

## Variables de entorno necesarias (API)

Copiar y completar `apps/api/.env.example`:

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_SUCCESS_URL`
- `STRIPE_CANCEL_URL`

## Primer arranque local

1. Instalar dependencias:

   ```bash
   pnpm install
   ```

2. Levantar postgres:

   ```bash
   docker compose up -d postgres
   ```

3. Variables de entorno:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

4. Prisma + seed:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

5. Desarrollo:

   ```bash
   pnpm dev
   ```

## Endpoints de FASE 2

- `GET /pricing`
- `POST /billing/checkout-session`
- `POST /billing/portal-session`
- `GET /subscriptions/:laboratoryId`
- `POST /webhooks/stripe`

> Nota: esta fase **no** incluye OMA/delivery.
