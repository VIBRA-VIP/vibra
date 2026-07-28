#!/bin/bash
# Wrapper: skip .vscode dirs during extract (Cursor sandbox blocks mkdir .vscode)
REAL_TAR=/usr/bin/tar
args=()
extract=0
for a in "$@"; do
  case "$a" in
    -*x*|x|*x*) extract=1 ;;
  esac
  args+=("$a")
done
if [[ $extract -eq 1 ]]; then
  exec "$REAL_TAR" "${args[@]}" --exclude='.vscode' --exclude='*/.vscode' --exclude='*/.vscode/*'
else
  exec "$REAL_TAR" "${args[@]}"
fi
