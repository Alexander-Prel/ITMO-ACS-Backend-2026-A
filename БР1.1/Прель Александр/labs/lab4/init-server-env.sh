#!/usr/bin/env bash
set -euo pipefail
umask 077
base=${1:-/opt/itmo-booking}
install -d -m 0700 "$base/shared"
target="$base/shared/.env.compose"
if [[ -e "$target" ]]; then exit 0; fi
temp=$(mktemp "$base/shared/.env.XXXXXX")
trap 'rm -f "$temp"' EXIT
id=$(openssl rand -hex 6)
{
  printf 'COMPOSE_PROJECT_NAME=itmo-lab4-%s\nIMAGE_PREFIX=itmo-lab4-%s\n' "$id" "$id"
  printf 'BIND_ADDRESS=127.0.0.1\nPUBLIC_PORT=8200\n'
  for key in JWT_SECRET SERVICE_KEY RABBITMQ_PASSWORD; do printf '%s=%s\n' "$key" "$(openssl rand -hex 32)"; done
} > "$temp"
ln "$temp" "$target" || test -f "$target"
