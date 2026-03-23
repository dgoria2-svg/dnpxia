# Decisiones técnicas y supuestos

## 2026-03-23 — Monorepo con pnpm + Turborepo

Se eligió esta combinación por ser liviana, madura y adecuada para coordinar `apps/web`, `apps/api` y `packages/shared` sin agregar complejidad innecesaria.

## 2026-03-23 — Web con Next.js

Se eligió Next.js porque permite cubrir desde una landing pública hasta un dashboard autenticado con una sola base tecnológica moderna.

## 2026-03-23 — API con Fastify

Se eligió Fastify por rendimiento, ergonomía con TypeScript y una base simple para crecer sin imponer demasiada estructura en esta primera entrega.

## 2026-03-23 — Base de datos PostgreSQL + Prisma

Se eligió PostgreSQL por adecuación a un SaaS multi-tenant relacional. Prisma se usa para acelerar el modelado inicial, migraciones y tipado.

## 2026-03-23 — Auth base con email + password + JWT

No se definió aún un proveedor externo de identidad ni SSO. Para no inventar decisiones de negocio mayores, se deja una autenticación base por email/password y JWT, suficiente para validar el flujo inicial.

## 2026-03-23 — Roles mínimos de membresía

Se definieron `OWNER`, `ADMIN`, `STAFF` y `MEMBER` como roles iniciales razonables para laboratorios. Si negocio define una matriz más precisa, se ajustará sin romper la estructura.

## 2026-03-23 — Estado de suscripción acotado

Se modelaron estados `TRIAL`, `ACTIVE`, `PAST_DUE`, `CANCELED` y `EXPIRED` para reflejar el alcance pedido sin sobre-modelar billing antes de tiempo.

## 2026-03-23 — Placeholder Android documental

La app Android no se implementa todavía; se deja documentada su ubicación, responsabilidades y contratos esperados para evitar relleno artificial.
