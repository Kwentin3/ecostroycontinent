# CDN_MEDIA_DELIVERY_IMPLEMENTATION v1

Date: 2026-04-28
Scope: Selectel CDN media delivery implementation and production verification

## Result

CDN delivery is enabled in production in safe `auto` mode.

The application still keeps the app proxy fallback path, but healthy public media now redirects to Selectel CDN.

## Changed Infrastructure

Current media bucket:

- `ecostroycontinent-media-ru3-20260428`

Custom public origin attached to the current bucket:

- `https://media.ecostroycontinent.ru`

Current Selectel CDN v3 resource:

- name: `ecostroycontinent-media-cdn-v3`
- id: `bab68f25-17dd-402e-9a8e-70a294915a47`
- default CDN domain: `bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net`
- origin server: `media.ecostroycontinent.ru:443`
- origin Host header: `media.ecostroycontinent.ru`
- origin HTTPS: enabled
- origin SSL verify: disabled, because the custom Object Storage origin was only confirmed locally with `curl -k`

Selectel CDN API status after rollout:

- endpoint: `GET /cdn/v3/resources/bab68f25-17dd-402e-9a8e-70a294915a47/status`
- status: `Completed`

## Production Runtime

Production app image deployed:

- `ghcr.io/kwentin3/ecostroycontinent-app@sha256:3aa28a0bcb8ae6d9c6a8f6b133e3ce4f8760b94f90fa2f978b60f7ccd952edf3`

GitHub Actions:

- build workflow run: `25076706516`
- deploy workflow run: `25076833128`

Runtime media env confirmed inside `repo-app-1`:

```text
MEDIA_DELIVERY_MODE=auto
MEDIA_PUBLIC_BASE_URL=https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net
MEDIA_S3_BUCKET=ecostroycontinent-media-ru3-20260428
MEDIA_S3_ENDPOINT_URL=https://s3.ru-3.storage.selcloud.ru
MEDIA_S3_LOCAL_FALLBACK_ENABLED=false
MEDIA_S3_REGION=ru-3
MEDIA_STORAGE_MODE=s3
```

Server-side backup before env mutation:

- `/opt/ecostroycontinent/runtime/.env.pre-cdn-20260428T204649Z`

## Code Hardening

Commit:

- `7f6511a fix: prepare media cdn delivery rollout`

Code change:

- `getMediaDeliveryUrl()` now respects `MEDIA_DELIVERY_MODE=app_proxy`.
- If `MEDIA_PUBLIC_BASE_URL` is present but delivery mode is explicitly `app_proxy`, admin/storage URL derivation stays on the app route.

Why this matters:

- CDN can now be toggled by env without leaving a hidden raw-CDN URL path behind during rollback.

## Verification

Local test command:

```powershell
node --test tests/media-storage.test.js tests/public-media-delivery.test.js
```

Result:

- `15` tests passed
- `0` failed

Test integrity notes:

- Shell context: PowerShell.
- ENV-sensitive tests use Node `execFile` with explicit env objects, not mixed shell syntax.
- The irreversible boundary for this change is URL selection before HTTP redirect/streaming starts; tests assert the selected returned URL/mode before that boundary.

Production HTTP checks:

```text
https://ecostroycontinent.ru/api/health -> 200 application/json
https://ecostroycontinent.ru/api/media-public/entity_193254fe-2ef2-4dba-b10a-c16c694e7557 -> 302 to CDN
final CDN URL -> 200 image/webp
```

Direct CDN object checks:

```text
https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp -> 200 image/webp
https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/03daa15f-1b58-4633-b5ab-b805418ef0ae.jpg -> 200 image/jpeg
```

Browser checks:

- MCP Playwright `navigate -> snapshot` succeeded for `/admin/entities/media_asset`, redirecting unauthenticated browser to `/admin/login`.
- Authenticated local Playwright opened `/admin/entities/media_asset`.
- Media admin screen result: `19` images, `0` broken images.
- Admin media previews intentionally use protected `/api/admin/media/<entityId>/preview` URLs.

Important distinction:

- Public media delivery uses `/api/media-public/<entityId>` and now redirects to CDN when CDN is healthy.
- Admin previews remain behind the authenticated admin preview route.

## Rollback

Runtime rollback remains env-only:

```text
MEDIA_PUBLIC_BASE_URL=
MEDIA_DELIVERY_MODE=app_proxy
```

Then restart the app container through the same compose/deploy surface.

The server-side backup from this rollout can also be restored if needed:

```bash
cp /opt/ecostroycontinent/runtime/.env.pre-cdn-20260428T204649Z /opt/ecostroycontinent/runtime/.env
```

## Follow-up

Consider adding a dedicated fresh CDN canary object and pointing the admin infra sidebar probe at it instead of using the first arbitrary object in the bucket.
