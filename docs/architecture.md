# Arquitectura inicial

## Visión general

DNPXIA se define como un **monorepo TypeScript** con un backend central como fuente de verdad para usuarios, laboratorios, licencias, dispositivos y suscripciones.

## Componentes

### `apps/web`
- Sitio público para explicar el producto.
- Login base para usuarios.
- Dashboard placeholder para iterar el panel interno.

### `apps/api`
- API central HTTP.
- Autenticación base con JWT.
- Prisma como acceso a datos.
- Modelo multi-tenant preparado para laboratorios, membresías, dispositivos y licencias.

### `apps/android`
- Placeholder documental para el cliente Android.
- Contratos esperados de autenticación y licencias.

### `packages/shared`
- Tipos compartidos de dominio.
- Contratos de API y enums reutilizables.

## Modelo de tenancy

- Un **laboratorio** contrata el servicio.
- Un **usuario** puede pertenecer a uno o más laboratorios mediante `Membership`.
- Cada membresía define el rol del usuario dentro del laboratorio.
- Los **dispositivos** pertenecen al usuario y opcionalmente se asocian a un laboratorio para control operativo.
- Las **licencias** reflejan permisos de consumo para apps cliente, incluyendo Android.
- El backend conserva el límite configurable de dispositivos por usuario a nivel global y a nivel de suscripción si se necesitara ajustar luego.

## Base de datos

Se eligió PostgreSQL por robustez y porque encaja mejor con un SaaS multi-tenant relacional que probablemente evolucione hacia auditoría, reporting y reglas de negocio transaccionales.

## Flujo inicial de autenticación

1. Usuario se registra o inicia sesión en la API.
2. La API valida credenciales y devuelve JWT.
3. La web persiste el token localmente para siguiente iteración del dashboard.
4. Android consumirá el mismo backend con un contrato específico de dispositivos/licencias en una fase posterior.

## Módulos esperados a futuro

- Billing / suscripciones.
- Gestión de licencias por laboratorio y usuario.
- Administración multi-laboratorio.
- Auditoría de accesos y dispositivos.
- Integración con app Android y eventual backoffice operativo.
