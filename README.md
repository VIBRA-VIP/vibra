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

## Deploy web (Vercel)

1. En [vercel.com](https://vercel.com) → **Add New Project** → importa `VIBRA-VIP/vibra`.
2. Deja el **Root Directory** en la raíz del monorepo (no `apps/web`).
3. Vercel usa `vercel.json`:
   - Install: `pnpm install`
   - Build: packages + `@vibra/web`
   - Output: `apps/web/dist`
4. Variables de entorno (Production / Preview):
   - `VITE_API_URL` → URL pública de la API
   - `VITE_WS_URL` → misma URL (Socket.io)

### Versionado por deploy

Cada push a `main` (excepto commits `chore(release):`) dispara el workflow `.github/workflows/version-tag.yml`:

- Sube el patch de `apps/web/package.json` (`0.1.0` → `0.1.1`…)
- Crea tag git anotado `v0.1.1`
- Empuja commit + tag (Vercel despliega esa versión)

La app muestra la versión abajo a la derecha / en el sidebar (`v0.1.1+abc1234`).

Tag manual:

```bash
pnpm release:web
```

## Notas

- `DATABASE_URL` usa el puerto **5433** porque muchas máquinas ya tienen Postgres en 5432.
- Los scripts `db:*` usan `DOCKER_CONFIG` del repo (plugin Compose incluido).
