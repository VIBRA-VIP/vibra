# Vibra

Plataforma web de interacción entre usuarios y creadores (chat, videollamadas, créditos).

## Stack

- **Monorepo:** Turborepo + pnpm
- **Web:** React 19, Vite, TailwindCSS, TanStack Query, Zustand
- **API:** NestJS, Prisma, PostgreSQL, Socket.io, JWT
- **Videollamadas:** Jitsi Meet (fases posteriores)

## Requisitos

- Node.js >= 22
- pnpm 9 (`npm install -g pnpm` or Corepack)
- Docker runtime (Docker Desktop **o** Colima)

## Inicio rápido

```bash
# Si usas Colima (sin Docker Desktop):
# colima start

pnpm install
pnpm run build:packages

cp .env.example .env
cp .env.example apps/api/.env
cp .env.example apps/web/.env

# Postgres en Docker (host port 5433 para no chocar con Postgres local)
pnpm db:up

pnpm --filter @vibra/api prisma:generate
pnpm --filter @vibra/api prisma:migrate
pnpm --filter @vibra/api prisma:seed

pnpm dev
```

- Web: http://localhost:5173
- API health: http://localhost:3000/health

### Seed admin

- Email: `admin@vibra.app`
- Password: `Admin123!`

## Estructura

```
apps/web       Frontend (features/)
apps/api       Backend NestJS (modules/)
packages/ui    Componentes / tokens
packages/types Tipos y enums compartidos
packages/shared Utilidades
packages/config Presets TypeScript
```

## Notas

- `DATABASE_URL` usa el puerto **5433** porque muchas máquinas ya tienen Postgres en 5432.
- Los scripts `db:*` usan `DOCKER_CONFIG` del repo (plugin Compose incluido).
