#!/usr/bin/env bash
# Vercel Ignored Build Step:
#   exit 0 → skip build
#   exit 1 → proceed with build
#
# Production only deploys versioned release commits so each deploy maps to a git tag.
# Preview deployments (PRs / other branches) always build.
set -euo pipefail

if [[ "${VERCEL_ENV:-}" != "production" ]]; then
  exit 1
fi

msg="${VERCEL_GIT_COMMIT_MESSAGE:-}"
if [[ "$msg" == chore\(release\):* ]]; then
  exit 1
fi

exit 0
