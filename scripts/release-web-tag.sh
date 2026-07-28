#!/usr/bin/env bash
# Manual alternative to the GitHub Action: bump web version, commit, tag, push.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree dirty. Commit or stash first." >&2
  exit 1
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [[ "$BRANCH" != "main" ]]; then
  echo "Switch to main before tagging (current: $BRANCH)." >&2
  exit 1
fi

CURRENT="$(node -p "require('./apps/web/package.json').version")"
IFS=. read -r MAJOR MINOR PATCH <<< "$CURRENT"
NEXT="${MAJOR}.${MINOR}.$((PATCH + 1))"
TAG="v${NEXT}"

node <<NODE
const fs = require('fs');
const path = 'apps/web/package.json';
const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
pkg.version = '${NEXT}';
fs.writeFileSync(path, \`\${JSON.stringify(pkg, null, 2)}\\n\`);
NODE

git add apps/web/package.json
git commit -m "chore(release): v${NEXT}"
git tag -a "$TAG" -m "Web deploy ${TAG}"
git push origin main
git push origin "$TAG"

echo "Released ${TAG}"
