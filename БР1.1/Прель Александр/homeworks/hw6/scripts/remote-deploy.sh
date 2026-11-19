#!/usr/bin/env bash
set -Eeuo pipefail

is_safe_absolute_path() {
  local value="${1:-}"
  local segment
  local -a segments

  [[ "$value" =~ ^/([A-Za-z0-9._-]+/)*[A-Za-z0-9._-]+$ ]] || return 1
  IFS='/' read -r -a segments <<< "${value#/}"
  for segment in "${segments[@]}"; do
    [[ "$segment" != '.' && "$segment" != '..' ]] || return 1
  done
}

is_valid_port() {
  local port="${1:-}"
  [[ "$port" =~ ^[0-9]{1,5}$ ]] || return 1
  (( 10#$port >= 1 && 10#$port <= 65535 ))
}

main() {
  local BASE_DIR="${1:?Usage: remote-deploy.sh BASE_DIR REVISION}"
  local REVISION="${2:?Usage: remote-deploy.sh BASE_DIR REVISION}"
  local LAB4_RELATIVE='БР1.1/Прель Александр/labs/lab4'
  local ARCHIVE RELEASE_DIR SHARED_CONFIG LAB4_DIR
  local -a COMPOSE

  is_safe_absolute_path "$BASE_DIR" || { echo 'Unsafe deployment path' >&2; exit 2; }
  [[ "$REVISION" =~ ^[a-f0-9]{40}$ ]] || { echo 'Invalid Git revision' >&2; exit 2; }
  command -v docker >/dev/null || { echo 'Docker is not installed' >&2; exit 2; }
  command -v curl >/dev/null || { echo 'curl is not installed' >&2; exit 2; }
  docker compose version >/dev/null

  ARCHIVE="/tmp/itmo-backend-${REVISION}.tar.gz"
  RELEASE_DIR="$BASE_DIR/releases/$REVISION"
  SHARED_CONFIG="$BASE_DIR/shared/.env.compose"
  LAB4_DIR="$RELEASE_DIR/$LAB4_RELATIVE"

  [[ -f "$ARCHIVE" ]] || { echo 'Release archive is missing' >&2; exit 2; }
  [[ -f "$SHARED_CONFIG" ]] || { echo 'Server .env.compose is missing' >&2; exit 2; }

  set -a
  # The server owner creates this validated key/value file outside Git.
  . "$SHARED_CONFIG"
  set +a

  [[ "${COMPOSE_PROJECT_NAME:-}" =~ ^itmo-lab4-[a-f0-9]{12}$ ]] || { echo 'Invalid COMPOSE_PROJECT_NAME' >&2; exit 2; }
  [[ "${IMAGE_PREFIX:-}" =~ ^itmo-lab4-[a-f0-9]{12}$ ]] || { echo 'Invalid IMAGE_PREFIX' >&2; exit 2; }
  [[ "${BIND_ADDRESS:-}" == '127.0.0.1' ]] || { echo 'BIND_ADDRESS must be 127.0.0.1' >&2; exit 2; }
  is_valid_port "${PUBLIC_PORT:-}" || { echo 'Invalid PUBLIC_PORT' >&2; exit 2; }

  # Serialize CI, manual and Ansible deployments to the same VM.
  mkdir -p "$BASE_DIR/releases"
  exec 9>"$BASE_DIR/.deploy.lock"
  flock -w 600 9 || { echo 'Another deployment is active' >&2; exit 1; }
  mkdir -p "$RELEASE_DIR"
  tar -xzf "$ARCHIVE" -C "$RELEASE_DIR"
  ln -sfn "$SHARED_CONFIG" "$LAB4_DIR/.env.compose"

  cd "$LAB4_DIR"
  COMPOSE=(docker compose --project-name "$COMPOSE_PROJECT_NAME" --env-file .env.compose -f docker-compose.yml)
  "${COMPOSE[@]}" config --quiet
  "${COMPOSE[@]}" build
  rollback() {
    local previous
    previous=$(readlink "$BASE_DIR/current" || true)
    if [[ "$previous" == "$BASE_DIR/releases/"* && "$previous" != "$RELEASE_DIR" && -d "$previous/$LAB4_RELATIVE" ]]; then
      (cd "$previous/$LAB4_RELATIVE" &&
        "${COMPOSE[@]}" build &&
        "${COMPOSE[@]}" up --detach --wait --wait-timeout 120) || echo 'Rollback failed; inspect container logs' >&2
    fi
  }
  if ! "${COMPOSE[@]}" up --detach --wait --wait-timeout 120; then
    rollback
    exit 1
  fi

  for attempt in {1..20}; do
    if curl --fail --silent --show-error --max-time 5 "http://127.0.0.1:${PUBLIC_PORT}/ready" >/dev/null; then
      ln -sfn "$RELEASE_DIR" "$BASE_DIR/.current-next"
      mv -Tf "$BASE_DIR/.current-next" "$BASE_DIR/current"
      rm -f "$ARCHIVE"
      printf 'Revision %s is healthy on 127.0.0.1:%s\n' "$REVISION" "$PUBLIC_PORT"
      exit 0
    fi
    sleep 2
  done

  rollback
  echo 'Deployment readiness check failed; current symlink was not changed' >&2
  exit 1
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  main "$@"
fi
