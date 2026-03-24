# DNPXIA - decisiones

## Arquitectura base

- Backend oficial en Fastify + Prisma + PostgreSQL.
- Frontend web en Next.js.
- Modelo multi-tenant por laboratorio.

## FASE 2 (billing y suscripciones)

- Stripe es el PSP elegido para cobrar suscripciones.
- Trial estándar de 15 días parametrizado por plan (`Plan.trialDays`).
- La fuente de verdad de pricing en backend es la tabla `Plan`.
- Se agregan IDs de Stripe en entidades de dominio (`stripePriceId`, `stripeCustomerId`, `stripeSubscriptionId`).
- Entitlements se guardan explícitamente en tabla `Entitlement` para permitir evolución futura por feature flags/cupos.
- Webhooks se guardan en `WebhookEvent` con deduplicación por `eventId`.
- El webhook actual sincroniza:
  - estado de suscripción,
  - periodos,
  - entitlement `devices.max`.

## Alcance fuera de FASE 2

- No se implementa OMA/delivery en esta fase.
- No se implementan aún flujos de fulfilment físico ni tracking de entregas.
