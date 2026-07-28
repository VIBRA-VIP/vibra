#!/usr/bin/env bash
# Netlify ignore build:
#   exit 0 → skip build
#   exit 1 → proceed with build
#
# Always build — env vars (VITE_*) are baked at build time and must refresh on every deploy.
set -euo pipefail
exit 1
