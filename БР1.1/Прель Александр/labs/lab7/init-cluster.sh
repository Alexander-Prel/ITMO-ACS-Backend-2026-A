#!/usr/bin/env bash
# One-time namespace bootstrap in the specified course cluster.
set -euo pipefail
context=${1:?Specify the course kubectl context}
k=(kubectl --context "$context")
"${k[@]}" get namespace booking-sem2 >/dev/null 2>&1 || "${k[@]}" create namespace booking-sem2
if ! "${k[@]}" -n booking-sem2 get secret booking-secrets >/dev/null 2>&1; then
  umask 077
  temp=$(mktemp)
  trap 'rm -f "$temp"' EXIT
  for key in JWT_SECRET SERVICE_KEY RABBITMQ_PASSWORD; do printf '%s=%s\n' "$key" "$(openssl rand -hex 32)"; done > "$temp"
  "${k[@]}" -n booking-sem2 create secret generic booking-secrets --from-env-file="$temp"
fi
