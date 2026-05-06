# MEDIA_DELIVERY_LAUNCH_POSTURE v0.1

Date: 2026-05-06
Project: Экостройконтинент
Scope: controlled CDN media delivery launch posture closure

## Executive Verdict

`MEDIA_CDN_SWITCHED_AND_VERIFIED`

The media delivery P1 is closed narrowly. Production now runs S3-backed media with `MEDIA_DELIVERY_MODE=auto` and `MEDIA_PUBLIC_BASE_URL=https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net`.

This is intentionally not hard `cdn` mode. `auto` probes the CDN with a read-only `HEAD` request and keeps app proxy as fallback if the CDN probe fails. The SQL/S3/CDN boundary stays intact: SQL remains metadata truth, S3 remains binary truth, and content entities continue to reference media by entity id / storage key rather than raw public URLs.

## Baseline Before Switch

Local baseline:

- `git status --short --branch`: `## main...origin/main`
- `git branch --show-current`: `main`
- `git rev-parse --short HEAD`: `3ec975e`
- production `/api/readiness`: `200`, `status=ready`, `database.status=ok`, runtime commit `fa6d3042c31f891b34e3e6c898fb536f81a0b677`

Production container before switch:

- app container id: `d77029ced6322e5430382e79611489ad09468859bdb6365bbd42fe360caa9ddf`
- image id: `sha256:b674a804154c3864601069a05b5cf6301a6b272271972d4880c29acc677ed3e3`
- image ref: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:43a211cbcd4c8cd093677ce02fda820af5f744c16364517f41f9a53fefed62fb`

Production env before switch, read without printing secret values:

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

Important deployment finding:

- `/opt/ecostroycontinent/repo` was still at `19935e9` and had a stale `compose.yaml` that did not inject `MEDIA_DELIVERY_MODE`.
- Local/current canonical `compose.yaml` already included `MEDIA_DELIVERY_MODE` and `MEDIA_S3_LOCAL_FALLBACK_ENABLED`.
- The server repo was fast-forwarded to `3ec975e` before the env switch, so Docker Compose used the canonical env surface instead of an ad-hoc container edit.

## Code Findings

Relevant implementation:

- `lib/config.js`
  - `MEDIA_STORAGE_MODE`: `local|s3`
  - `MEDIA_DELIVERY_MODE`: `app_proxy|cdn|auto`, default `app_proxy`
  - `MEDIA_PUBLIC_BASE_URL` is required only when S3 storage uses `cdn` or `auto`
- `lib/media/public-delivery.js`
  - `app_proxy`: returns `/api/media-public/:entityId`
  - `cdn`: returns `MEDIA_PUBLIC_BASE_URL/<storageKey>`
  - `auto`: probes CDN with read-only `HEAD` and falls back to app proxy on failure
- `app/api/media-public/[entityId]/route.js`
  - resolves published `media_asset` metadata from SQL
  - redirects to CDN only if resolver selects CDN
  - otherwise streams bytes through the app proxy
- `lib/read-side/public-media-url.js`
  - public read-side preview URL remains `/api/media-public/:entityId`

Boundary assessment:

- SQL remains metadata truth.
- S3 remains binary truth.
- CDN is now the normal successful public delivery path.
- App proxy remains the runtime fallback path.
- Public Web does not own media truth.
- No Content Core, publish workflow, migration, or production content mutation was performed.

## Published Media Inventory

Read-only SQL query found existing published media assets with `storageKey`; no production test asset was created.

Primary smoke asset:

```text
entityId=entity_ae17b84b-9b6f-4c96-bae5-6af06a73851f
storageKey=media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg
mimeType=image/jpeg
originalFilename=hyundai-hx520l.jpg
status=ready
lifecycleState=active
```

Legacy root-level asset used for compatibility check:

```text
entityId=entity_193254fe-2ef2-4dba-b10a-c16c694e7557
storageKey=840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp
mimeType=image/webp
```

The rollout had to verify both `media/...` keys and legacy root-level keys.

## CDN Preflight

Operator workstation CDN `HEAD` samples:

- `media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`: `12/12` returned `200 image/jpeg`
- `840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp`: `12/12` returned `200 image/webp`

Production VM CDN `HEAD` samples:

- `media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`: `12/12` returned `200 image/jpeg`
- `840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp`: `12/12` returned `200 image/webp`

CDN `GET` samples:

- operator `GET` for the `media/...` asset: `200 image/jpeg`, size `130246`
- operator `GET` for the legacy asset: `200 image/webp`, size `36694`
- production VM `GET` for the `media/...` asset: `200 image/jpeg`, size `130246`
- production VM `GET` for the legacy asset: `200 image/webp`, size `36694`

Bucket origin checks:

- `https://media.ecostroycontinent.ru/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`: `200 image/jpeg`, `content-length=130246`, `age=0` with TLS verification bypass
- `https://media.ecostroycontinent.ru/840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp`: `200 image/webp`, `content-length=36694`, `age=0` with TLS verification bypass

The previous intermittent cached `403 HIT` was not reproduced in this pass across the sampled operator and VM probes.

## Switch Execution

Runtime env backup:

- `/opt/ecostroycontinent/runtime/.env.pre-media-auto-20260506T191740Z`

Runtime env changes:

```text
MEDIA_PUBLIC_BASE_URL=https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net
MEDIA_DELIVERY_MODE=auto
```

Compose verification before restart:

```text
MEDIA_DELIVERY_MODE: auto
MEDIA_PUBLIC_BASE_URL: https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net
MEDIA_S3_LOCAL_FALLBACK_ENABLED: "false"
image: ghcr.io/kwentin3/ecostroycontinent-app@sha256:43a211cbcd4c8cd093677ce02fda820af5f744c16364517f41f9a53fefed62fb
```

Restart command:

```bash
docker compose \
  --env-file /opt/ecostroycontinent/runtime/.env \
  --env-file /opt/ecostroycontinent/runtime/app-image.env \
  --project-name repo \
  -f compose.yaml \
  up -d app
```

No migration was run. Postgres was not changed. Production content and media assets were not mutated.

Production container after switch:

- app container id: `091132a5c5817b7740ec7f92c71e2dd0881dcf1320239a751694ce70a55e2576`
- image ref unchanged: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:43a211cbcd4c8cd093677ce02fda820af5f744c16364517f41f9a53fefed62fb`
- sql container unchanged and healthy: `fb3ffc327e29cd2ceb7c4e98ab386d6a7737b29b7591b15ceb54d7f9d9b03112`

Container env after switch:

```text
MEDIA_STORAGE_MODE=s3
MEDIA_DELIVERY_MODE=auto
MEDIA_PUBLIC_BASE_URL=https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net
MEDIA_S3_LOCAL_FALLBACK_ENABLED=false
```

Startup logs:

```text
Next.js 16.2.4
Ready in 0ms
```

No critical startup errors were present in the sampled logs.

## Production Acceptance

Readiness:

- `/api/readiness`: `200`
- `database.status=ok`
- runtime commit: `fa6d3042c31f891b34e3e6c898fb536f81a0b677`

Public app media route handoff:

- `/api/media-public/entity_ae17b84b-9b6f-4c96-bae5-6af06a73851f`: `302` to `https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`
- following redirect: `200 image/jpeg`, size `130246`
- `/api/media-public/entity_193254fe-2ef2-4dba-b10a-c16c694e7557`: `302` to `https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp`
- following redirect: `200 image/webp`, size `36694`

Post-switch launch smoke:

```powershell
$env:APP_BASE_URL='https://ecostroycontinent.ru'
$env:EXPECT_RUNTIME_COMMIT='true'
$env:EXPECT_MEDIA_URL='https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg'
npm run smoke:launch
```

Result:

- exit code: `0`
- `passed=23`
- `failed=0`
- `known_content_blocker=2`
- `skipped=0`
- media check: direct CDN URL returned `200`
- `/about` and `/contacts`: still expected `known_content_blocker`
- sitemap: `/about` and `/contacts` absent while known missing
- admin routes: protected with redirect to `/admin/login`

Post-switch direct CDN checks:

- `media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg`: `200 image/jpeg`
- `840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp`: `200 image/webp`

## Smoke Coverage

Runbook now uses the direct CDN URL for `EXPECT_MEDIA_URL` because, in `auto` mode, the public app route correctly returns `302` when the CDN probe passes. The app route handoff is verified separately with `curl -I` and `curl -L`.

Current smoke URL:

```text
https://bab68f25-17dd-402e-9a8e-70a294915a47.selcdn.net/media/e3604676-6db4-4205-b9f8-96c0318bf4f7.jpg
```

This URL is operational smoke evidence, not editorial truth. Content entities must still reference media by `entityId`, `storageKey`, or media refs.

## Changed Files

- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`
- `docs/reports/2026-05-06/MEDIA_DELIVERY_LAUNCH_POSTURE_Экостройконтинент_v0.1.report.md`

No app code changed in this pass. The server was updated to the already-committed canonical `compose.yaml` and the runtime env was changed on the host.

## Commands Run

Baseline and runtime:

```powershell
git status --short --branch
git branch --show-current
git rev-parse --short HEAD
curl.exe -sS https://ecostroycontinent.ru/api/readiness
npm run smoke:launch
```

CDN and media checks:

```powershell
curl.exe -I <cdn-media-url>
curl.exe -L <cdn-media-url>
curl.exe -k -I <bucket-origin-url>
curl.exe -I https://ecostroycontinent.ru/api/media-public/<entityId>
curl.exe -L https://ecostroycontinent.ru/api/media-public/<entityId>
```

Server/deploy:

```bash
cd /opt/ecostroycontinent/repo
git fetch origin main
git pull --ff-only origin main
cp -p /opt/ecostroycontinent/runtime/.env /opt/ecostroycontinent/runtime/.env.pre-media-auto-20260506T191740Z
# update MEDIA_PUBLIC_BASE_URL and MEDIA_DELIVERY_MODE
docker compose --env-file /opt/ecostroycontinent/runtime/.env --env-file /opt/ecostroycontinent/runtime/app-image.env --project-name repo -f compose.yaml config
docker compose --env-file /opt/ecostroycontinent/runtime/.env --env-file /opt/ecostroycontinent/runtime/app-image.env --project-name repo -f compose.yaml up -d app
docker logs --since 5m repo-app-1
docker ps --no-trunc
```

Post-edit local verification:

```powershell
npm test
npm run build
git diff --check
git status --short --branch
```

Results:

- `npm test`: passed, `464/464`
- `npm run build`: passed, Next.js production build completed successfully
- `git diff --check`: passed; Git printed only Windows line-ending warnings for the two edited Markdown files
- pre-commit local status: two docs files modified

## Open Items

- Keep monitoring CDN edge behavior after launch. Rollback remains simple: set `MEDIA_DELIVERY_MODE=app_proxy`, clear `MEDIA_PUBLIC_BASE_URL`, and restart `app`.
- Harden CDN origin TLS for `media.ecostroycontinent.ru`; the origin probe still uses TLS verification bypass in the operational check.
- Keep `/about` and `/contacts` as owner/content blockers until approved content is provided and published.
- Refresh the runbook media smoke URL if the selected published asset is intentionally unpublished or removed.

## Final Git Status

Final clean status after documentation commit/push is recorded in the task close-out response.
