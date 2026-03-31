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

## FASE 3 (base de acceso/licencias)

- Se agrega una capa mínima de validación de acceso con backend como fuente de verdad para web y Android.
- `GET /me/access` expone una decisión consolidada por laboratorio (`allowed`, estado de suscripción, cupo de dispositivos).
- Se define trial operativo de 15 días con tope estricto de 1 dispositivo por usuario/laboratorio.
- Para planes pagos se usa `Plan.maxDevicesPerUser`; el plan base seeded mantiene 3 dispositivos.
- `POST /devices/validate` registra/actualiza huella de dispositivo y aplica límites con razones estandarizadas (`trial_expired`, `subscription_inactive`, `device_limit_reached`, `membership_not_found`, `lab_inactive`).
- `POST /subscriptions/start-trial` inicia (o reinicia) trial mínimo para permitir bootstrap funcional sin depender de checkout de Stripe.

## FASE 4 (selector de laboratorio en web)

- Cuando un usuario pertenece a múltiples laboratorios, la web exige seleccionar un laboratorio activo antes de entrar al dashboard.
- La selección activa de laboratorio en web se persiste en `localStorage` bajo la clave `dnpxia.activeLabId`.
- `GET /me` devuelve `user` + `memberships` para que el frontend pueda construir el selector.
- `GET /me/access` acepta `labId` explícito.
- Si el usuario tiene más de una membresía y no envía `labId`, `GET /me/access` responde `lab_selection_required`.
- Si el `activeLabId` guardado deja de ser válido para el usuario, la web limpia esa selección y redirige a `/select-lab`.
- El dashboard usa siempre el `labId` activo para resolver acceso, trial y cupo de dispositivos del contexto seleccionado.
