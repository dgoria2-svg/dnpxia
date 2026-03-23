# DNPXIA

Base inicial de DNPXIA como monorepo para una plataforma SaaS multi-tenant de óptica/salud visual.

## Stack elegido

- **Monorepo:** pnpm workspaces + Turborepo.
- **Web:** Next.js 15 + React 19 + TypeScript.
- **API:** Fastify + Prisma + PostgreSQL.
- **Shared contracts:** paquete TypeScript reutilizable para tipos de dominio.
- **Tooling:** Prettier, TypeScript estricto, Vitest en API.

## Estructura del repositorio

```text
.
├── apps
│   ├── android
│   │   └── README.md
│   ├── api
│   │   ├── prisma
│   │   │   ├── migrations
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   ├── src
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web
│       ├── app
│       ├── components
│       ├── .env.example
│       ├── next.config.ts
│       ├── package.json
│       └── tsconfig.json
├── docs
├── packages
│   └── shared
├── .editorconfig
├── .gitignore
├── .npmrc
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── turbo.json
```

## Requisitos

- Node.js 22+
- pnpm 10+
- Docker opcional para levantar PostgreSQL localmente

> Si tu máquina no tiene `pnpm`, con acceso normal a npm podés habilitarlo con:
>
> ```bash
> corepack enable
> corepack prepare pnpm@10.7.0 --activate
> ```

## Primer arranque local

1. Clonar el repositorio y entrar a la carpeta:

   ```bash
   git clone <tu-remote> dnpxia
   cd dnpxia
   ```

2. Instalar dependencias del monorepo:

   ```bash
   pnpm install
   ```

3. Levantar PostgreSQL local con Docker (recomendado):

   ```bash
   docker compose up -d postgres
   ```

4. Configurar variables de entorno:

   ```bash
   cp apps/api/.env.example apps/api/.env
   cp apps/web/.env.example apps/web/.env.local
   ```

5. Generar Prisma Client, aplicar migración y cargar seed:

   ```bash
   pnpm db:generate
   pnpm db:migrate
   pnpm db:seed
   ```

6. Iniciar web + API en desarrollo:

   ```bash
   pnpm dev
   ```

## Comandos útiles desde raíz

| Comando | Qué hace |
| --- | --- |
| `pnpm install` | instala dependencias del monorepo |
| `pnpm dev` | levanta web y API en paralelo con Turbo |
| `pnpm dev:web` | levanta solo la web |
| `pnpm dev:api` | levanta solo la API |
| `pnpm build` | compila todos los workspaces |
| `pnpm lint` | corre chequeos de tipado/lint livianos |
| `pnpm test` | ejecuta los tests configurados |
| `pnpm db:generate` | genera Prisma Client |
| `pnpm db:migrate` | aplica migraciones de desarrollo |
| `pnpm db:seed` | carga datos iniciales mínimos |
| `pnpm format` | formatea el repositorio con Prettier |

## Puertos por defecto

- Web: http://localhost:3000
- API: http://localhost:4000
- Health API: http://localhost:4000/health

## Credenciales seed

- Email: `owner@dnpxia.local`
- Password: `ChangeMe123!`

## Qué deja esta base

- Landing pública sobria y lista para crecer.
- Pantalla de login funcional conectada al backend.
- Dashboard placeholder con foco en próximos módulos.
- Backend con health check, auth base, modelo inicial multi-tenant y semilla inicial.
- Documentación inicial de arquitectura, alcance, decisiones y roadmap.

## Pendiente para Fase 2

- Endpoints reales de suscripciones/billing.
- Gestión avanzada de membresías y permisos por laboratorio.
- Integración Android con autenticación de dispositivos.
- Panel autogestionado con CRUD real para laboratorios, usuarios y licencias.
- Observabilidad, CI y endurecimiento de seguridad.
