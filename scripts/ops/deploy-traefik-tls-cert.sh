#!/usr/bin/env sh
set -eu

lineage="${RENEWED_LINEAGE:-/etc/letsencrypt/live/ecostroycontinent.ru}"
cert_file="${TRAEFIK_CERT_FILE:-/opt/ecostroycontinent/traefik/certs/ecostroycontinent.crt}"
key_file="${TRAEFIK_KEY_FILE:-/opt/ecostroycontinent/traefik/certs/ecostroycontinent.key}"
container="${TRAEFIK_CONTAINER_NAME:-ecostroycontinent-traefik}"
marker="${TRAEFIK_CERTBOT_MARKER:-/run/ecostroycontinent-traefik-stopped-by-certbot}"

if [ ! -s "$lineage/fullchain.pem" ]; then
  echo "missing_fullchain: $lineage/fullchain.pem" >&2
  exit 1
fi

if [ ! -s "$lineage/privkey.pem" ]; then
  echo "missing_privkey: $lineage/privkey.pem" >&2
  exit 1
fi

cert_dir="$(dirname "$cert_file")"
key_dir="$(dirname "$key_file")"
install -d -m 0755 "$cert_dir"
install -d -m 0755 "$key_dir"

tmp_cert="$(mktemp "$cert_file.tmp.XXXXXX")"
tmp_key="$(mktemp "$key_file.tmp.XXXXXX")"
cleanup() {
  rm -f "$tmp_cert" "$tmp_key"
}
trap cleanup EXIT

cp "$lineage/fullchain.pem" "$tmp_cert"
cp "$lineage/privkey.pem" "$tmp_key"
chown root:root "$tmp_cert" "$tmp_key"
chmod 0644 "$tmp_cert"
chmod 0600 "$tmp_key"

mv "$tmp_cert" "$cert_file"
mv "$tmp_key" "$key_file"
trap - EXIT

if command -v openssl >/dev/null 2>&1; then
  openssl x509 -in "$cert_file" -noout -subject -issuer -dates
fi

if command -v docker >/dev/null 2>&1 &&
  docker ps --format '{{.Names}}' | grep -Fxq "$container" &&
  [ ! -f "$marker" ]; then
  docker restart "$container" >/dev/null
  echo "traefik_restarted_after_cert_deploy"
else
  echo "traefik_restart_deferred_or_not_running"
fi
