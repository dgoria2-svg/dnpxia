# Product scope inicial

## Objetivo de la fase

Construir una base entendible, ejecutable y lista para iterar sobre DNPXIA como producto SaaS multi-tenant para óptica/salud visual.

## Incluido en esta entrega

- Monorepo inicial.
- Web pública con CTA, login base y dashboard placeholder.
- API central con health check, auth base y estructura de dominio.
- Modelado inicial de planes, suscripciones, usuarios, laboratorios, dispositivos y licencias.
- Paquete compartido de contratos.
- Documentación inicial para arquitectura, decisiones y roadmap.

## No incluido todavía

- Checkout real y pasarela de pagos.
- Recuperación de contraseña y flujos de email.
- Control de acceso fino por feature.
- Sincronización offline Android.
- Observabilidad completa, métricas, tracing y jobs.
- Panel de administración completo.

## Roadmap sugerido

### Fase 2
- CRUD de laboratorios y membresías.
- Gestión de dispositivos y revocación de sesiones.
- Endpoints iniciales para licencias consumidas por Android.
- Protección real del dashboard web.

### Fase 3
- Billing real, trials y límites por plan.
- Auditoría, eventos y trazabilidad.
- Integraciones externas si negocio las necesita.
