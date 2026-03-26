#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env.local"

touch "$ENV_FILE"

echo "This will update: $ENV_FILE"
echo "It will REMOVE any existing R2_* entries first, then write the new ones."
echo

read -r -p "R2_BUCKET: " R2_BUCKET
read -r -p "R2_ACCOUNT_ID: " R2_ACCOUNT_ID
read -r -p "R2_ACCESS_KEY_ID: " R2_ACCESS_KEY_ID
read -r -s -p "R2_SECRET_ACCESS_KEY (hidden): " R2_SECRET_ACCESS_KEY
echo
read -r -p "R2_PUBLIC_BASE_URL (optional, can be blank): " R2_PUBLIC_BASE_URL

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT

if [[ -s "$ENV_FILE" ]]; then
  # Keep everything except existing R2_* entries.
  grep -vE '^(R2_ACCOUNT_ID|R2_ACCESS_KEY_ID|R2_SECRET_ACCESS_KEY|R2_BUCKET|R2_PUBLIC_BASE_URL)=' "$ENV_FILE" >"$tmp" || true
else
  : >"$tmp"
fi

{
  echo
  echo "# Cloudflare R2 (server-only; do NOT expose to client)"
  echo "R2_ACCOUNT_ID=$R2_ACCOUNT_ID"
  echo "R2_ACCESS_KEY_ID=$R2_ACCESS_KEY_ID"
  echo "R2_SECRET_ACCESS_KEY=$R2_SECRET_ACCESS_KEY"
  echo "R2_BUCKET=$R2_BUCKET"
  if [[ -n "${R2_PUBLIC_BASE_URL}" ]]; then
    echo "R2_PUBLIC_BASE_URL=$R2_PUBLIC_BASE_URL"
  fi
} >>"$tmp"

mv "$tmp" "$ENV_FILE"
chmod 600 "$ENV_FILE" 2>/dev/null || true

echo
echo "Done."
