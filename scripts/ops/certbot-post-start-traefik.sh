#!/usr/bin/env sh
set -eu

container="${TRAEFIK_CONTAINER_NAME:-ecostroycontinent-traefik}"
marker="${TRAEFIK_CERTBOT_MARKER:-/run/ecostroycontinent-traefik-stopped-by-certbot}"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker_not_found"
  exit 1
fi

if [ -f "$marker" ]; then
  docker start "$container"
  rm -f "$marker"
  echo "traefik_started_after_certbot"
else
  echo "traefik_was_not_stopped_by_certbot_hook"
fi
