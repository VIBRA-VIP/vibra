#!/usr/bin/env bash
# Set Bold API key on Lightsail and recreate the API container.
# Usage (from repo root):
#   export BOLD_API_KEY='...'
#   bash scripts/set-bold-key-lightsail.sh
set -euo pipefail

HOST="${LIGHTSAIL_HOST:-3.17.154.80}"
KEY_FILE="${LIGHTSAIL_KEY_FILE:-$HOME/.ssh/vibra-lightsail}"
BOLD_API_KEY="${BOLD_API_KEY:?Set BOLD_API_KEY first}"

SSH=(ssh -i "$KEY_FILE" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 "ubuntu@${HOST}")

echo "==> Writing BOLD_API_KEY on ${HOST}"
"${SSH[@]}" bash -s <<REMOTE
set -euo pipefail
cd "\$HOME/vibra"
touch .env
grep -vE '^BOLD_API_KEY=' .env > .env.tmp || true
echo "BOLD_API_KEY=${BOLD_API_KEY}" >> .env.tmp
mv .env.tmp .env
chmod 600 .env
sudo docker compose -f docker-compose.prod.yml --env-file .env up -d api
REMOTE

echo "==> Done. Configure Bold webhook to: http://${HOST}:3000/api/credits/webhooks/bold"
echo "    (or https://tu-dominio-api/... if tienes proxy HTTPS)"
