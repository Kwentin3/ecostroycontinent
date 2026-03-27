#!/usr/bin/env sh
set -eu

# Canonical internal entrypoint for test-data cleanup on the Linux VM.
# Example:
#   sh /opt/ecostroycontinent/repo/scripts/cleanup-test-data-runtime.sh --dry-run
#   sh /opt/ecostroycontinent/repo/scripts/cleanup-test-data-runtime.sh --confirm
# This wrapper keeps the tool on the server-side Docker network and runtime env.

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
REPO_ROOT=$(CDPATH= cd -- "${SCRIPT_DIR}/.." && pwd)
APP_CONTAINER_NAME=${APP_CONTAINER_NAME:-repo-app-1}
APP_NETWORK=${APP_NETWORK:-repo_default}
APP_ENV_FILE=${APP_ENV_FILE:-/opt/ecostroycontinent/runtime/.env}

if [ ! -f "${APP_ENV_FILE}" ]; then
  echo "Runtime env file not found: ${APP_ENV_FILE}" >&2
  exit 1
fi

APP_IMAGE=${APP_IMAGE_OVERRIDE:-}

if [ -z "${APP_IMAGE}" ]; then
  APP_IMAGE=$(docker inspect "${APP_CONTAINER_NAME}" --format '{{.Config.Image}}')
fi

exec docker run --rm \
  --env-file "${APP_ENV_FILE}" \
  --network "${APP_NETWORK}" \
  -v "${REPO_ROOT}:/workspace" \
  -w /workspace \
  "${APP_IMAGE}" \
  node scripts/cleanup-test-data.mjs "$@"
