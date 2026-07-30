#!/usr/bin/env bash
# Start Postgres + API + Web in one go (local development).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

free_port() {
  local port="$1"
  local pids
  pids="$(lsof -tiTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)"
  if [[ -n "${pids}" ]]; then
    echo "    Matando procesos en :$port -> ${pids}"
    # shellcheck disable=SC2086
    kill -9 ${pids} 2>/dev/null || true
  fi
}

echo "==> Liberando puertos 3000 y 5173..."
free_port 3000
free_port 5173
# Nest --watch a veces deja procesos huérfanos
pkill -9 -f 'nest start --watch' 2>/dev/null || true
pkill -9 -f '@nestjs/cli/bin/nest.js' 2>/dev/null || true
sleep 1
free_port 3000
free_port 5173

if lsof -tiTCP:3000 -sTCP:LISTEN >/dev/null 2>&1; then
  echo "ERROR: el puerto 3000 sigue ocupado. Corre: kill -9 \$(lsof -tiTCP:3000 -sTCP:LISTEN)"
  exit 1
fi

echo "==> Levantando Postgres..."
pnpm db:up

echo "==> Esperando Postgres..."
for i in $(seq 1 30); do
  if docker exec vibra-postgres pg_isready -U vibra >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "==> Prisma generate + migrate..."
pnpm --filter @vibra/api exec prisma generate
pnpm --filter @vibra/api exec prisma migrate deploy

echo "==> Arrancando API + Web (Ctrl+C para parar)..."
echo "    Web:  http://localhost:5173"
echo "    API:  http://localhost:3000"
echo ""
pnpm dev
