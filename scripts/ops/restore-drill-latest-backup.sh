#!/usr/bin/env bash
set -Eeuo pipefail

OUT_DIR="${BACKUP_LOCAL_DIR:-/opt/ecostroycontinent/backups/local}"
POSTGRES_IMAGE="${RESTORE_DRILL_POSTGRES_IMAGE:-postgres:16-alpine}"

cd /

latest="$(find "$OUT_DIR" -maxdepth 1 -type f -name 'postgres-*.sql.gz' -printf '%T@ %p\n' | sort -nr | head -1 | cut -d' ' -f2-)"

if [[ -z "$latest" || ! -f "$latest" ]]; then
  echo "restore_drill_failed reason=missing_backup dir=$OUT_DIR" >&2
  exit 1
fi

gzip -t "$latest"

container="restore-drill-$(date -u +%Y%m%d%H%M%S)"
cleanup() {
  docker rm -f "$container" >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker run -d --rm --name "$container" -e POSTGRES_PASSWORD=restore_drill "$POSTGRES_IMAGE" >/dev/null

for attempt in $(seq 1 30); do
  if docker exec "$container" pg_isready -U postgres >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" == "30" ]]; then
    echo "restore_drill_failed reason=temp_postgres_not_ready" >&2
    exit 1
  fi
  sleep 1
done

docker cp "$latest" "$container:/tmp/backup.sql.gz" >/dev/null
docker exec "$container" sh -lc \
  'gzip -dc /tmp/backup.sql.gz | psql -v ON_ERROR_STOP=1 -U postgres -d postgres >/tmp/restore.out'

docker exec "$container" psql -v ON_ERROR_STOP=1 -U postgres -d postgres -Atc "
select 'tables=' || count(*) from information_schema.tables where table_schema='public';
select 'migration_rows=' || count(*) from schema_migrations;
select 'content_entities=' || count(*) from content_entities;
select 'published_revisions=' || count(*) from content_revisions where state='published';
select 'media_entities=' || count(*) from content_entities where entity_type='media_asset';
"

echo "restore_drill_ok file=$latest"
