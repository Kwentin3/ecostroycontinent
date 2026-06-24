#!/usr/bin/env sh
set -eu

container="${TRAEFIK_CONTAINER_NAME:-ecostroycontinent-traefik}"
marker="${TRAEFIK_CERTBOT_MARKER:-/run/ecostroycontinent-traefik-stopped-by-certbot}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker_not_found"
  exit 1
fi

if docker ps --format '{{.Names}}' | grep -Fxq "$container"; then
  docker stop --timeout 30 "$container"
  touch "$marker"
  echo "traefik_stopped_for_certbot"
else
  echo "traefik_not_running_before_certbot"
fi
