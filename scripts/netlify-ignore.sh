#!/usr/bin/env bash
# Netlify ignore build:
#   exit 0 → skip build
#   exit 1 → proceed with build
#
# Production only deploys versioned release commits so each deploy maps to a git tag.
# Deploy previews / branch deploys always build.
set -euo pipefail

context="${CONTEXT:-}"
if [[ "$context" != "production" ]]; then
  exit 1
fi

msg="$(git log -1 --pretty=%B 2>/dev/null || true)"
if [[ "$msg" == chore\(release\):* ]]; then
  exit 1
fi

exit 0
