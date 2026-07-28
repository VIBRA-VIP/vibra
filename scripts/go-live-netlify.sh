#!/usr/bin/env bash
# Point production API CORS at Netlify and redeploy latest API code.
set -euo pipefail

export PATH="${HOME}/Library/Python/3.9/bin:${HOME}/.local/bin:/opt/homebrew/bin:${PATH}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
KEY_FILE="${LIGHTSAIL_KEY_FILE:-$HOME/.ssh/vibra-lightsail}"
HOST="${LIGHTSAIL_HOST:-3.17.154.80}"
WEB_URL="${WEB_URL:-https://vibravip.netlify.app}"
API_URL="${API_URL:-http://${HOST}:3000}"

SSH=(ssh -i "$KEY_FILE" -o StrictHostKeyChecking=accept-new "ubuntu@${HOST}")

echo "==> Updating WEB_URL/API_URL on server"
"${SSH[@]}" bash -s <<REMOTE
set -euo pipefail
cd "\$HOME/vibra"
test -f .env
grep -vE '^(WEB_URL|API_URL)=' .env > .env.tmp || true
cat >> .env.tmp <<EOF
WEB_URL=${WEB_URL}
API_URL=${API_URL}
EOF
mv .env.tmp .env
chmod 600 .env
grep -E '^(WEB_URL|API_URL)=' .env
REMOTE

echo "==> Redeploying API from local tree"
export WEB_URL
bash "$ROOT/scripts/deploy-lightsail.sh"

echo "==> Smoke tests"
curl -fsS "${API_URL}/health"
echo
curl -fsS "${API_URL}/api/media/health"
echo
echo "Done. Set Netlify env VITE_API_URL and VITE_WS_URL to ${API_URL} and trigger deploy."
