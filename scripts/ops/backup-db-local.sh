#!/usr/bin/env bash
set -Eeuo pipefail

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SQL_CONTAINER="${SQL_CONTAINER:-repo-sql-1}"
OUT_DIR="${BACKUP_LOCAL_DIR:-/opt/ecostroycontinent/backups/local}"
LOG_FILE="${BACKUP_LOG_FILE:-/var/log/ecostroycontinent/backup.log}"
BACKUP_S3_ENV="${BACKUP_S3_ENV:-/opt/ecostroycontinent/runtime/backup-s3.env}"
LOCAL_RETENTION_DAYS="${BACKUP_LOCAL_RETENTION_DAYS:-7}"
REQUIRE_S3="${BACKUP_REQUIRE_S3:-false}"

cd /

mkdir -p "$OUT_DIR" "$(dirname "$LOG_FILE")"

FILE="$OUT_DIR/postgres-$STAMP.sql.gz"
CHECKSUM_FILE="$FILE.sha256"

write_log() {
  local message="$1"
  local line
  line="$(printf '%s %s\n' "$(date -u +%FT%TZ)" "$message")"
  printf '%s\n' "$line"
  printf '%s\n' "$line" >> "$LOG_FILE"
}

on_error() {
  local status="$?"
  write_log "backup_failed status=$status file=$FILE"
  exit "$status"
}
trap on_error ERR

# Keep dumps role-agnostic so a fresh PostgreSQL cluster can restore them without
# pre-creating the production app role.
docker exec "$SQL_CONTAINER" sh -lc \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -9 > "$FILE"

gzip -t "$FILE"
sha256sum "$FILE" > "$CHECKSUM_FILE"

s3_status="skipped"
if [[ -f "$BACKUP_S3_ENV" ]] && command -v /usr/local/bin/aws >/dev/null 2>&1; then
  set -a
  # shellcheck disable=SC1090
  source "$BACKUP_S3_ENV"
  set +a

  : "${AWS_ENDPOINT_URL:?AWS_ENDPOINT_URL is required in backup S3 env}"
  : "${BACKUP_S3_BUCKET:?BACKUP_S3_BUCKET is required in backup S3 env}"
  : "${BACKUP_S3_PREFIX:?BACKUP_S3_PREFIX is required in backup S3 env}"

  /usr/local/bin/aws --endpoint-url "$AWS_ENDPOINT_URL" \
    s3 cp "$FILE" "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$FILE")"
  /usr/local/bin/aws --endpoint-url "$AWS_ENDPOINT_URL" \
    s3 cp "$CHECKSUM_FILE" "s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$CHECKSUM_FILE")"
  s3_status="ok"
  write_log "backup_s3_ok s3://$BACKUP_S3_BUCKET/$BACKUP_S3_PREFIX/$(basename "$FILE")"
elif [[ "$REQUIRE_S3" == "true" ]]; then
  write_log "backup_s3_missing env=$BACKUP_S3_ENV"
  exit 1
fi

find "$OUT_DIR" -type f \( -name '*.sql.gz' -o -name '*.sql.gz.sha256' \) -mtime +"$LOCAL_RETENTION_DAYS" -delete

write_log "backup_local_ok file=$FILE bytes=$(stat -c '%s' "$FILE") s3=$s3_status"
