# DNPXIA - decisiones iniciales

- Fase 0: validar infraestructura y puertos antes de meter frameworks más pesados.
- Base de datos inicial: PostgreSQL 16.
- API inicial: Node + Express mínimo con endpoint de health.
- Web inicial: Node mínimo que sirve una landing temporal.
- Multi-tenant base: tenants, users_account, tenant_memberships, plans, subscriptions, devices.
- Decisión temporal: todavía no hay auth real ni hash de password; primero dejamos listo el flujo de negocio.
- Próximo paso: endpoint de bootstrap para alta de laboratorio + owner + trial.
