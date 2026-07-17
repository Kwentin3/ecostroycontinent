#!/usr/bin/env bash
set -Eeuo pipefail

OUT_DIR="${BACKUP_LOCAL_DIR:-/opt/ecostroycontinent/backups/local}"
BACKUP_S3_ENV="${BACKUP_S3_ENV:-/opt/ecostroycontinent/runtime/backup-s3.env}"
MAX_AGE_HOURS="30"
REQUIRE_REMOTE="false"

while [[ "$#" -gt 0 ]]; do
  case "$1" in
    --max-age-hours)
      MAX_AGE_HOURS="$2"
      shift 2
      ;;
    --require-remote)
      REQUIRE_REMOTE="true"
      shift
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

cd /

if [[ ! -d "$OUT_DIR" ]]; then
  echo "backup_verify_failed reason=missing_dir dir=$OUT_DIR" >&2
  exit 1
fi

latest="$(find "$OUT_DIR" -maxdepth 1 -type f -name 'postgres-*.sql.gz' -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)"

if [[ -z "$latest" || ! -f "$latest" ]]; then
  echo "backup_verify_failed reason=missing_backup dir=$OUT_DIR" >&2
  exit 1
fi

gzip -t "$latest"

checksum_file="$latest.sha256"
if [[ -f "$checksum_file" ]]; then
  sha256sum -c "$checksum_file" >/dev/null
fi

now="$(date -u +%s)"
mtime="$(stat -c '%Y' "$latest")"
age_seconds="$((now - mtime))"
max_age_seconds="$((MAX_AGE_HOURS * 3600))"

if (( age_seconds > max_age_seconds )); then
  echo "backup_verify_failed reason=stale file=$latest age_seconds=$age_seconds max_age_seconds=$max_age_seconds" >&2
  exit 1
fi

remote_status="skipped"
if [[ "$REQUIRE_REMOTE" == "true" ]]; then
  if [[ ! -f "$BACKUP_S3_ENV" ]]; then
    echo "backup_verify_failed reason=missing_s3_env env=$BACKUP_S3_ENV" >&2
    exit 1
  fi
  if ! command -v /usr/local/bin/aws >/dev/null 2>&1; then
    echo "backup_verify_failed reason=missing_aws_cli" >&2
    exit 1
  fi

  set -a
  # shellcheck disable=SC1090
  source "$BACKUP_S3_ENV"
  set +a

  : "${AWS_ENDPOINT_URL:?AWS_ENDPOINT_URL is required in backup S3 env}"
  : "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required in backup S3 env}"
  : "${BACKUP_S3_PREFIX:?BACKUP_S3_PREFIX is required in backup S3 env}"

  key="$BACKUP_S3_PREFIX/$(basename "$latest")"
  remote_size="$(/usr/local/bin/aws --endpoint-url "$AWS_ENDPOINT_URL" \
    s3api head-object \
    --bucket "$BACKUP_S3_BUCKET" \
    --key "$key" \
    --query ContentLength \
    --output text)"
  local_size="$(stat -c '%s' "$latest")"

  if [[ "$remote_size" != "$local_size" ]]; then
    echo "backup_verify_failed reason=remote_size_mismatch file=$latest remote_size=$remote_size local_size=$local_size" >&2
    exit 1
  fi

  if [[ -f "$checksum_file" ]]; then
    tmp_remote_checksum="$(mktemp)"
    trap 'rm -f "$tmp_remote_checksum"' EXIT
    /usr/local/bin/aws --endpoint-url "$AWS_ENDPOINT_URL" \
      s3 cp "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$checksum_file")" "$tmp_remote_checksum" \
      --only-show-errors
    if [[ "$(cut -d' ' -f1 "$checksum_file")" != "$(cut -d' ' -f1 "$tmp_remote_checksum")" ]]; then
      echo "backup_verify_failed reason=remote_checksum_mismatch file=$latest" >&2
      exit 1
    fi
  fi

  remote_status="ok"
fi

echo "backup_verify_ok file=$latest age_seconds=$age_seconds remote=$remote_status"
