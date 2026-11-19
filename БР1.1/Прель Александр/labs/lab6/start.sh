#!/usr/bin/env bash
# Run on the dedicated Linux VM, from this release.
set -euo pipefail
cd "$(dirname "$0")"
config=${APP_ENV:-/opt/itmo-booking/shared/.env.compose}
source "$config"
export APP_NETWORK="${COMPOSE_PROJECT_NAME}_backend"
DOCKER_BRIDGE_IP=$(docker network inspect bridge --format '{{(index .IPAM.Config 0).Gateway}}')
export DOCKER_BRIDGE_IP
: "${GRAFANA_PASSWORD:?Set a password locally on the VM}"
docker compose --project-name booking-monitor up -d
