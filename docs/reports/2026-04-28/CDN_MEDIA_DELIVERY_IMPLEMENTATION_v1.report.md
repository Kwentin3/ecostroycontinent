# CDN_MEDIA_DELIVERY_IMPLEMENTATION v1

Date: 2026-04-28
Scope: Selectel CDN media delivery implementation and production verification

## Result

CDN origin wiring was implemented, but CDN delivery is **not** left enabled in production.

Reason: Selectel CDN still returns intermittent cached `403 HIT` responses from some edge nodes, even after the resource status reports `Completed`.

Production was rolled back to app-proxy delivery so public images stay healthy.

## Changed Infrastructure

Current media bucket:

- `ecostroycontinent-media-ru3-20260428`

Custom public origin attached to the current bucket:

- `https://media.ecostroycontinent.ru`

Primary Selectel CDN v3 resource configured during this pass:

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

Additional clean-resource attempts were created to test whether stale edge cache was resource-specific:

- `f9dd4de5-683c-42b2-ad0e-85f6e8c2a613.selcdn.net`
- `6a951f9b-7acb-4010-a263-5c3ab7f1cd7c.selcdn.net`

They showed the same edge inconsistency after completion and are not used by production.

## Production Runtime

Production app image deployed:

- `ghcr.io/kwentin3/ecostroycontinent-app@sha256:3aa28a0bcb8ae6d9c6a8f6b133e3ce4f8760b94f90fa2f978b60f7ccd952edf3`

GitHub Actions:

- build workflow run: `25076706516`
- deploy workflow run: `25076833128`

Runtime media env after rollback:

```text
MEDIA_DELIVERY_MODE=app_proxy
MEDIA_PUBLIC_BASE_URL=
MEDIA_S3_BUCKET=ecostroycontinent-media-ru3-20260428
MEDIA_S3_ENDPOINT_URL=https://s3.ru-3.storage.selcloud.ru
MEDIA_S3_LOCAL_FALLBACK_ENABLED=false
MEDIA_S3_REGION=ru-3
MEDIA_STORAGE_MODE=s3
```

Server-side backup before env mutation:

- `/opt/ecostroycontinent/runtime/.env.pre-cdn-20260428T204649Z`

Server-side backup before rollback:

- `/opt/ecostroycontinent/runtime/.env.rollback-cdn-20260428T212914Z`

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
https://ecostroycontinent.ru/api/media-public/entity_193254fe-2ef2-4dba-b10a-c16c694e7557 -> 200 image/webp, no CDN redirect after rollback
```

Direct CDN object checks from the operator workstation can return `200`, for example:

```text
https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp -> 200 image/webp
https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/03daa15f-1b58-4633-b5ab-b805418ef0ae.jpg -> 200 image/jpeg
```

But repeated CDN edge sampling from the production VM still found cached `403 HIT` responses on some edge IDs, including `1371`, `1436`, `1438`, `1524`.

Purge API notes:

- Accepted format: `POST /cdn/v3/cache/tasks` with `domain`, `action=delete`, `action_type=single`, `paths`.
- The purge task was accepted, but task status ended as `failed`.
- Repeating with `with_extra_zones=true` also ended as `failed`.
- The task response included `rate: [61, 61]`, so this may be provider-side purge quota/rate behavior.

Browser checks:

- MCP Playwright `navigate -> snapshot` succeeded for `/admin/entities/media_asset`, redirecting unauthenticated browser to `/admin/login`.
- Authenticated local Playwright opened `/admin/entities/media_asset`.
- Media admin screen result: `19` images, `0` broken images.
- Admin media previews intentionally use protected `/api/admin/media/<entityId>/preview` URLs.

Important distinction:

- Public media delivery uses `/api/media-public/<entityId>` and currently stays on app proxy.
- Admin previews remain behind the authenticated admin preview route.

## Rollback

Runtime rollback is currently applied:

```text
MEDIA_PUBLIC_BASE_URL=
MEDIA_DELIVERY_MODE=app_proxy
```

App health and media-public probes are green after rollback.

## Follow-up

Do not enable `MEDIA_DELIVERY_MODE=auto` or `cdn` again until repeated edge sampling returns only `200` from both:

- the operator workstation;
- the production VM.

Next Selectel-side action:

- ask Selectel support why completed CDN v3 resources for `media.ecostroycontinent.ru` return cached `403 HIT` on only some edge IDs;
- include the observed edge IDs and failed purge task IDs from this report.
