#!/usr/bin/env bash
# Create (or reuse) an AWS Lightsail instance and deploy Vibra API + Postgres.
#
# Prerequisites:
#   aws sts get-caller-identity   # must work
#
# Usage:
#   export WEB_URL=https://YOUR_SITE.netlify.app   # optional but recommended
#   bash scripts/deploy-lightsail.sh
set -euo pipefail

export PATH="${HOME}/Library/Python/3.9/bin:${HOME}/.local/bin:/opt/homebrew/bin:${PATH}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
REGION="${AWS_REGION:-us-east-2}"
INSTANCE_NAME="${LIGHTSAIL_INSTANCE_NAME:-vibra-api}"
BUNDLE_ID="${LIGHTSAIL_BUNDLE_ID:-small_3_0}" # ~2GB RAM
BLUEPRINT_ID="${LIGHTSAIL_BLUEPRINT_ID:-ubuntu_24_04}"
AVAILABILITY_ZONE="${LIGHTSAIL_AZ:-${REGION}a}"
KEY_PAIR_NAME="${LIGHTSAIL_KEY_PAIR_NAME:-vibra-lightsail}"
# Local OpenSSH key (generated here, public key imported into Lightsail)
KEY_FILE="${LIGHTSAIL_KEY_FILE:-$HOME/.ssh/${KEY_PAIR_NAME}}"
API_PORT="${API_PORT:-3000}"
WEB_URL="${WEB_URL:-}"

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing command: $1" >&2
    exit 1
  }
}

need_cmd aws
need_cmd ssh
need_cmd scp
need_cmd python3
need_cmd openssl
need_cmd rsync
need_cmd curl

echo "==> Checking AWS identity (region ${REGION})"
if ! aws sts get-caller-identity --region "$REGION"; then
  echo >&2
  echo "No AWS credentials. Create an Access Key and run:" >&2
  echo "  aws configure" >&2
  echo "Region: ${REGION}" >&2
  exit 1
fi

mkdir -p "$(dirname "$KEY_FILE")"

# Create key in Lightsail and save private key locally.
# Note: despite the name, privateKeyBase64 is often already PEM text (not base64).
if [[ ! -f "$KEY_FILE" ]]; then
  if aws lightsail get-key-pair --key-pair-name "$KEY_PAIR_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "Lightsail key '$KEY_PAIR_NAME' exists but local private key is missing: $KEY_FILE" >&2
    echo "Delete it and retry: aws lightsail delete-key-pair --key-pair-name $KEY_PAIR_NAME --region $REGION" >&2
    exit 1
  fi

  echo "==> Creating Lightsail key pair: $KEY_PAIR_NAME"
  TMPJSON="$(mktemp)"
  aws lightsail create-key-pair \
    --key-pair-name "$KEY_PAIR_NAME" \
    --region "$REGION" \
    --output json >"$TMPJSON"

  KEY_FILE="$KEY_FILE" TMPJSON="$TMPJSON" python3 - <<'PY'
import base64, json, os, pathlib
data = json.load(open(os.environ["TMPJSON"]))
val = data["privateKeyBase64"]
path = pathlib.Path(os.environ["KEY_FILE"])

def save_text(text: str) -> None:
    if not text.endswith("\n"):
        text += "\n"
    path.write_text(text)
    path.chmod(0o600)

if isinstance(val, str) and "BEGIN" in val[:80]:
    save_text(val.strip() + "\n")
    print(f"Saved PEM directly to {path} ({path.stat().st_size} bytes)")
else:
    raw = base64.b64decode(val)
    if raw.lstrip().startswith(b"-----BEGIN"):
        save_text(raw.decode("ascii"))
        print(f"Saved base64-decoded PEM to {path} ({path.stat().st_size} bytes)")
    else:
        raise SystemExit(
            "Could not parse Lightsail private key as PEM. "
            f"prefix={raw[:40]!r}"
        )
PY
  rm -f "$TMPJSON"
else
  echo "==> Using existing local key: $KEY_FILE"
  if ! aws lightsail get-key-pair --key-pair-name "$KEY_PAIR_NAME" --region "$REGION" >/dev/null 2>&1; then
    echo "Local key exists but Lightsail key pair '$KEY_PAIR_NAME' is missing." >&2
    echo "Remove local key and re-run." >&2
    exit 1
  fi
fi

if ! aws lightsail get-instance --instance-name "$INSTANCE_NAME" --region "$REGION" >/dev/null 2>&1; then
  echo "==> Creating Lightsail instance: $INSTANCE_NAME ($BUNDLE_ID / $BLUEPRINT_ID)"
  aws lightsail create-instances \
    --instance-names "$INSTANCE_NAME" \
    --availability-zone "$AVAILABILITY_ZONE" \
    --blueprint-id "$BLUEPRINT_ID" \
    --bundle-id "$BUNDLE_ID" \
    --key-pair-name "$KEY_PAIR_NAME" \
    --region "$REGION" \
    --tags "key=project,value=vibra" >/dev/null

  echo "==> Waiting for instance running..."
  for _ in $(seq 1 60); do
    STATE="$(aws lightsail get-instance --instance-name "$INSTANCE_NAME" --region "$REGION" --query 'instance.state.name' --output text 2>/dev/null || true)"
    [[ "$STATE" == "running" ]] && break
    sleep 5
  done
else
  echo "==> Reusing instance: $INSTANCE_NAME"
fi

PUBLIC_IP="$(aws lightsail get-instance --instance-name "$INSTANCE_NAME" --region "$REGION" --query 'instance.publicIpAddress' --output text)"
echo "==> Public IP: $PUBLIC_IP"
API_URL="http://${PUBLIC_IP}:${API_PORT}"
if [[ -z "$WEB_URL" ]]; then
  WEB_URL="$API_URL"
  echo "==> WEB_URL not set; using ${WEB_URL} temporarily (update later for Netlify CORS)"
fi

echo "==> Opening firewall ports 22 and ${API_PORT}"
aws lightsail open-instance-public-ports \
  --instance-name "$INSTANCE_NAME" \
  --region "$REGION" \
  --port-info fromPort=22,toPort=22,protocol=tcp >/dev/null || true
aws lightsail open-instance-public-ports \
  --instance-name "$INSTANCE_NAME" \
  --region "$REGION" \
  --port-info fromPort="$API_PORT",toPort="$API_PORT",protocol=tcp >/dev/null || true

SSH=(ssh -i "$KEY_FILE" -o StrictHostKeyChecking=accept-new -o ConnectTimeout=10 "ubuntu@${PUBLIC_IP}")

echo "==> Waiting for SSH..."
for _ in $(seq 1 48); do
  if "${SSH[@]}" 'echo ok' >/dev/null 2>&1; then
    break
  fi
  sleep 5
done
"${SSH[@]}" 'echo SSH_OK'

echo "==> Installing Docker"
scp -i "$KEY_FILE" -o StrictHostKeyChecking=accept-new \
  "$ROOT/scripts/lightsail-install-docker.sh" "ubuntu@${PUBLIC_IP}:/tmp/lightsail-install-docker.sh"
"${SSH[@]}" 'sudo bash /tmp/lightsail-install-docker.sh'

echo "==> Uploading project (rsync)"
"${SSH[@]}" 'mkdir -p "$HOME/vibra"'
rsync -az --delete \
  -e "ssh -i ${KEY_FILE} -o StrictHostKeyChecking=accept-new" \
  --exclude node_modules \
  --exclude .git \
  --exclude .turbo \
  --exclude '**/dist' \
  --exclude .env \
  --exclude '.env.*' \
  --exclude 'apps/web/node_modules' \
  --exclude 'apps/api/node_modules' \
  "$ROOT/" "ubuntu@${PUBLIC_IP}:vibra/"

POSTGRES_PASSWORD="$(openssl rand -base64 24 | tr -d '/+=' | head -c 32)"
JWT_ACCESS_SECRET="$(openssl rand -hex 32)"
JWT_REFRESH_SECRET="$(openssl rand -hex 32)"

# Keep existing secrets if .env already present on server
if "${SSH[@]}" 'test -f "$HOME/vibra/.env"'; then
  echo "==> Keeping existing server .env (updating API_URL / WEB_URL)"
  "${SSH[@]}" bash -s <<REMOTE
set -euo pipefail
cd "\$HOME/vibra"
grep -vE '^(API_URL|WEB_URL|API_PORT)=' .env > .env.tmp || true
cat >> .env.tmp <<EOF
API_PORT=${API_PORT}
API_URL=${API_URL}
WEB_URL=${WEB_URL}
EOF
mv .env.tmp .env
chmod 600 .env
REMOTE
else
  echo "==> Writing new .env"
  "${SSH[@]}" bash -s <<REMOTE
set -euo pipefail
cat > "\$HOME/vibra/.env" <<EOF
POSTGRES_USER=vibra
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=vibra
API_PORT=${API_PORT}
API_URL=${API_URL}
WEB_URL=${WEB_URL}
JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
JWT_ACCESS_EXPIRES_IN=30d
JWT_REFRESH_EXPIRES_IN=30d
EOF
chmod 600 "\$HOME/vibra/.env"
REMOTE
fi

echo "==> Building & starting containers (first build may take 5–10 min)"
"${SSH[@]}" 'cd "$HOME/vibra" && sudo docker compose -f docker-compose.prod.yml --env-file .env up -d --build'

echo "==> Waiting for health"
OK=0
for _ in $(seq 1 90); do
  if curl -fsS "${API_URL}/health" >/dev/null 2>&1; then
    OK=1
    break
  fi
  sleep 5
done

echo
echo "============================================"
if [[ "$OK" -eq 1 ]]; then
  echo " Vibra API is UP"
else
  echo " Deploy finished but /health not ready yet"
  echo " Check: ssh -i ${KEY_FILE} ubuntu@${PUBLIC_IP} 'sudo docker compose -f ~/vibra/docker-compose.prod.yml logs --tail=100'"
fi
echo " API:     ${API_URL}"
echo " Health:  ${API_URL}/health"
echo " WEB_URL: ${WEB_URL}"
echo
echo " Netlify env:"
echo "   VITE_API_URL=${API_URL}"
echo "   VITE_WS_URL=${API_URL}"
echo " SSH: ssh -i ${KEY_FILE} ubuntu@${PUBLIC_IP}"
echo "============================================"
