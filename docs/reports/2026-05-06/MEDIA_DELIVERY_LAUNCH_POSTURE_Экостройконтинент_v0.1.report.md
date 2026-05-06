# MEDIA_DELIVERY_LAUNCH_POSTURE v0.1

Date: 2026-05-06
Project: Экостройконтинент
Scope: read-only media delivery launch posture audit

## Executive Verdict

`MEDIA_APP_PROXY_ACCEPTED_FOR_LAUNCH`

Production media delivery is currently `app_proxy`, not CDN and not mixed mode. This is proven by production env: `MEDIA_STORAGE_MODE=s3`, `MEDIA_DELIVERY_MODE` is not injected, and `MEDIA_PUBLIC_BASE_URL` is empty. The app therefore uses the safe default `app_proxy`.

This is acceptable for launch because an existing published media asset is reachable through the public app-proxy route and is now covered by `smoke:launch` via `EXPECT_MEDIA_URL`. CDN remains the target model, but switching production delivery is a separate controlled rollout because it requires runtime env changes and sustained CDN edge sampling.

## Baseline

- `git status --short --branch`: `## main...origin/main`
- `git branch --show-current`: `main`
- `git rev-parse --short HEAD`: `6054f3f`
- Production `/api/readiness`: `200`, `status=ready`, `database.status=ok`, runtime commit `fa6d3042c31f891b34e3e6c898fb536f81a0b677`
- Production container before audit:
  - container id: `d77029ced6322e5430382e79611489ad09468859bdb6365bbd42fe360caa9ddf`
  - image id: `sha256:b674a804154c3864601069a05b5cf6301a6b272271972d4880c29acc677ed3e3`
  - app image ref: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:43a211cbcd4c8cd093677ce02fda820af5f744c16364517f41f9a53fefed62fb`

Baseline launch smoke without media:

- command: `APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true npm run smoke:launch`
- result: exit `0`
- summary: `passed=22`, `failed=0`, `known_content_blocker=2`, `skipped=1`
- media: `skipped/not_configured`

## Production Media Env

Read from the running app container without printing secret values:

```text
MEDIA_STORAGE_MODE=s3
MEDIA_DELIVERY_MODE=<empty>
MEDIA_PUBLIC_BASE_URL=<empty>
MEDIA_S3_LOCAL_FALLBACK_ENABLED=<empty>
MEDIA_STORAGE_DIR=<set>
MEDIA_S3_BUCKET=<set>
MEDIA_S3_REGION=<set>
MEDIA_S3_ENDPOINT_URL=<set>
MEDIA_S3_ACCESS_KEY_ID=<set>
MEDIA_S3_SECRET_ACCESS_KEY=<set>
```

Interpretation:

- storage is S3-backed;
- delivery mode is the code default `app_proxy`;
- CDN/public base URL is not configured in the runtime container;
- S3 credentials exist but were not printed.

## Code Findings

Relevant implementation:

- `lib/config.js`
  - `MEDIA_STORAGE_MODE`: `local|s3`
  - `MEDIA_DELIVERY_MODE`: `app_proxy|cdn|auto`, default `app_proxy`
  - `MEDIA_PUBLIC_BASE_URL` is required only when S3 storage uses `cdn` or `auto`
- `lib/media/storage.js`
  - S3 adapter reads/writes binaries by `storageKey`
  - `createMediaStorageKey()` writes new objects under `media/<uuid>.<ext>`
  - `getMediaDeliveryUrl()` uses CDN/public base only when delivery mode is not `app_proxy`
- `lib/media/public-delivery.js`
  - `app_proxy`: returns `/api/media-public/:entityId`
  - `cdn`: returns `MEDIA_PUBLIC_BASE_URL/<storageKey>`
  - `auto`: probes CDN with read-only `HEAD` and falls back to app proxy
- `app/api/media-public/[entityId]/route.js`
  - resolves published `media_asset` metadata from SQL
  - redirects to CDN only if resolver selects CDN
  - otherwise streams bytes through the app proxy with `content-type` and `cache-control`
- `lib/read-side/public-media-url.js`
  - public read-side preview URL remains `/api/media-public/:entityId`

Boundary assessment:

- SQL remains metadata truth.
- S3 remains binary truth.
- Public Web does not own media truth.
- Content entities do not need raw public CDN URLs.
- No Content Core or publish workflow change was made.

## Published Media Inventory

Read-only SQL query found existing published media assets with `storageKey`; no production test asset was created.

Sample selected for smoke:

```text
entityId=entity_ae17b84b-9b6f-4c96-bae5-6af06a73851f
storageKey=media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg
mimeType=image/jpeg
originalFilename=hyundai-hx520l.jpg
status=ready
lifecycleState=active
```

Other published assets include both new `media/...` keys and legacy root-level keys, so any future CDN switch must continue to support both path shapes.

## Read-Only Media Checks

App proxy:

- `https://ecostroycontinent.ru/api/media-public/entity_ae17b84b-9b6f-4c96-bae5-6af06a73851f`
- operator `HEAD`: `200`, `content-type: image/jpeg`, `cache-control: public, max-age=3600`
- production VM repeated `HEAD`: `4/4` returned `200 image/jpeg`

Bucket public origin:

- `https://media.ecostroycontinent.ru/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`
- with TLS verification bypass for the origin probe: `200`, `content-type: image/jpeg`, `content-length: 130246`, `age: 0`
- without bypass from the Windows operator curl, the origin host reports certificate principal mismatch; this matches the prior runbook note that CDN origin SSL verification was disabled.

CDN direct object:

- `https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`
- operator sample: `12/12` returned `200 image/jpeg`
- production VM clean sample: `8/8` returned `200 image/jpeg`, edge id `1372`, `MISS` then `HIT`
- legacy root-level object sample: `8/8` returned `200 image/webp`

Current sample did not reproduce cached `403`, but it is not enough to claim all CDN edges are stable. Previous production evidence documented intermittent cached `403 HIT` from some Selectel edge nodes after resource completion and failed purge tasks.

## Launch Decision

Chosen verdict: `MEDIA_APP_PROXY_ACCEPTED_FOR_LAUNCH`.

Reasons:

- It is the actual production mode today.
- It does not depend on CDN edge state.
- It keeps public URLs based on entity IDs instead of raw CDN URLs.
- It preserves SQL/S3 boundaries and does not mutate production content.
- Launch smoke now includes one stable existing media URL.

Remaining risks:

- App runtime handles media bytes, so media delivery is less cache-efficient than CDN.
- CDN currently looks healthier in sampled probes, but there is no sustained all-edge acceptance run.
- CDN origin TLS still needs explicit hardening before enabling strict origin verification.

Return to CDN when:

- `MEDIA_PUBLIC_BASE_URL` is intentionally set to the healthy CDN host;
- `MEDIA_DELIVERY_MODE=auto` is rolled out first, not `cdn`;
- repeated operator and production-VM samples return only `200` across representative object keys;
- public pages and `smoke:launch` pass with media smoke after restart.

## Smoke Coverage

Runbook was updated with a stable `EXPECT_MEDIA_URL`:

```powershell
$env:APP_BASE_URL='https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT='true'
$env:EXPECT_MEDIA_URL='https://ecostroycontinent.ru/api/media-public/entity_ae17b84b-9b6f-4c96-bae5-6af06a73851f'
npm run smoke:launch
```

Production smoke result:

- exit code: `0`
- `passed=23`
- `failed=0`
- `known_content_blocker=2`
- `skipped=0`
- media check: `200`, `media delivery ok`
- `/about` and `/contacts`: still expected `known_content_blocker`
- sitemap: `/about` and `/contacts` absent while known missing
- admin routes: protected with redirect to `/admin/login`

## Changed Files

- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`
- `docs/reports/2026-05-06/MEDIA_DELIVERY_LAUNCH_POSTURE_Экостройконтинент_v0.1.report.md`

No app code, env, compose, Dockerfile, migrations, Content Core, publish workflow, or production data changed.

## Deploy

No application deploy was required. The change is documentation and runbook only.

The running production container/image stayed unchanged:

- container id: `d77029ced6322e5430382e79611489ad09468859bdb6365bbd42fe360caa9ddf`
- image id: `sha256:b674a804154c3864601069a05b5cf6301a6b272271972d4880c29acc677ed3e3`

## Commands Run

Baseline and runtime:

```powershell
git status --short --branch
git branch --show-current
git rev-parse --short HEAD
npm run smoke:launch
```

Production checks:

```powershell
curl https://ecostroycontinent.ru/api/readiness
docker ps --format ...
docker inspect repo-app-1 ...
docker exec repo-app-1 printenv <media env names>
psql read-only SELECT for published media_asset rows
curl.exe -I https://ecostroycontinent.ru/api/media-public/entity_ae17b84b-9b6f-4c96-bae5-6af06a73851f
curl.exe -k -I https://media.ecostroycontinent.ru/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg
curl.exe -I https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg
APP_BASE_URL=https://ecostroycontinent.ru EXPECT_RUNTIME_COMMIT=true EXPECT_MEDIA_URL=<app-proxy-media-url> npm run smoke:launch
```

Post-edit verification:

```powershell
npm test
git diff --check
git status --short --branch
```

Results:

- `npm test`: passed, `464/464`
- `git diff --check`: passed; Git printed only the existing Windows line-ending warning for the runbook working copy
- `npm run build`: skipped because this pass changed only documentation/runbook/report files and did not alter runtime code, scripts, package metadata, Dockerfile, compose, or env mapping

## Open Items

- CDN target model remains open as a separate controlled rollout.
- Before switching, prefer `MEDIA_DELIVERY_MODE=auto` with `MEDIA_PUBLIC_BASE_URL` set, then restart and run production smoke with `EXPECT_MEDIA_URL`.
- Harden or explicitly document CDN origin TLS verification for `media.ecostroycontinent.ru`.
- Keep `/about` and `/contacts` as owner/content blockers until approved content is provided and published.
- Refresh the runbook media smoke URL if the selected published asset is intentionally unpublished or removed.

## Final Git Status

Post-edit, pre-commit:

```text
## main...origin/main
 M docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md
?? docs/reports/2026-05-06/MEDIA_DELIVERY_LAUNCH_POSTURE_Экостройконтинент_v0.1.report.md
```

Final clean status after commit/push is recorded in the task close-out response.
