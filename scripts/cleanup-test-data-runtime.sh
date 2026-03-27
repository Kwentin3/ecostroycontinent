#!/usr/bin/env sh
set -eu

# Canonical internal entrypoint for test-data cleanup on the Linux VM.
# Example:
#   sh /opt/ecostroycontinent/repo/scripts/cleanup-test-data-runtime.sh --dry-run
#   sh /opt/ecostroycontinent/repo/scripts/cleanup-test-data-runtime.sh --confirm
# This wrapper runs the packaged maintenance tool inside the canonical app
# runtime/container so cleanup sees the same env, network and closed-world
# dependencies as the live server.

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
APP_CONTAINER_NAME=${APP_CONTAINER_NAME:-repo-app-1}
APP_NETWORK=${APP_NETWORK:-repo_default}
APP_ENV_FILE=${APP_ENV_FILE:-/opt/ecostroycontinent/runtime/.env}
APP_PACKAGED_SCRIPT=${APP_PACKAGED_SCRIPT:-/app/scripts/cleanup-test-data.mjs}

if docker inspect "${APP_CONTAINER_NAME}" >/dev/null 2>&1; then
  exec docker exec "${APP_CONTAINER_NAME}" node "${APP_PACKAGED_SCRIPT}" "$@"
fi

APP_IMAGE=${APP_IMAGE_OVERRIDE:-}

if [ -z "${APP_IMAGE}" ]; then
  echo "App container not found and APP_IMAGE_OVERRIDE is empty." >&2
  exit 1
fi

if [ ! -f "${APP_ENV_FILE}" ]; then
  echo "Runtime env file not found: ${APP_ENV_FILE}" >&2
  exit 1
fi

exec docker run --rm \
  --env-file "${APP_ENV_FILE}" \
  --network "${APP_NETWORK}" \
  "${APP_IMAGE}" \
  node "${APP_PACKAGED_SCRIPT}" "$@"
