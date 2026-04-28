# MEDIA_UPLOAD_CDN_ACCESS_DENIED_HANDOFF v1

Date: 2026-04-28
Scope: admin media upload, S3 object keys, CDN delivery fallback

## Context

The admin media screen failed on image upload with an S3-style `AccessDenied` message after the CDN/media delivery refactor.

The important nuance is that CDN is only the public delivery layer. The app must still write binaries through the S3 adapter, and SQL remains the metadata source of truth. Raw CDN URLs must not become write targets or canonical media IDs.

## Root Cause

The upload routes generated new storage keys at the bucket root:

- `uuid.png`
- `uuid.jpg`

After the CDN hardening, production storage policy can reasonably allow app-owned media writes only under a bounded media prefix. Root-level `PutObject` then fails with `AccessDenied`.

The sidebar infra health probe had the same class of risk because it wrote `__health/sidebar/...` at the bucket root.

## Fix

Implemented a shared `createMediaStorageKey()` helper in `lib/media/storage.js`.

New media uploads now write keys like:

- `media/<uuid>.png`
- `media/<uuid>.jpg`

Updated routes:

- `app/api/admin/media/library/create/route.js`
- `app/api/admin/media/upload/route.js`

Updated infra probe:

- `lib/admin/infra-health.js` now writes `media/__health/sidebar/...`

Also updated legacy public route:

- `app/api/media/[entityId]/route.js` now uses `resolvePublicMediaDelivery()` instead of unconditionally redirecting to CDN in S3 mode.

That keeps `MEDIA_DELIVERY_MODE=app_proxy` and `auto` fallback meaningful for older `/api/media/:id` links.

## Guardrails For Future Agents

- Do not "fix" media upload by pointing writes at `MEDIA_PUBLIC_BASE_URL`; that is delivery-only.
- Do not remove the `media/` prefix from generated object keys unless the deployed S3 policy is changed first.
- Do not treat CDN root `403` as proof that media upload is broken; object-level path checks matter.
- When debugging production media, separate these layers: SQL metadata, S3 object existence/permissions, app proxy route, CDN route.
- Keep `MEDIA_DELIVERY_MODE=app_proxy` as the safe default unless CDN object probes are known healthy.

## Verification

Commands run from PowerShell in the canonical repo tree:

- `node --experimental-specifier-resolution=node --test tests\media-storage.test.js tests\public-media-delivery.test.js tests\public-media-preview-url.test.js`
- `npm run build`
- `npm test`
- standalone runtime smoke: `.next/standalone/server.js` on port `3107`, then `GET /api/health`

Observed outcomes after the handoff-test addition:

- targeted media tests: 15/15 passed
- full suite: 382/382 passed
- production build succeeded
- standalone health returned HTTP 200

## Live Playwright Follow-Up

After deployment, a live Playwright smoke against `https://ecostroycontinent.ru/admin/entities/media_asset?compose=upload` still reproduced the user-facing failure.

Observed browser path:

- temporary production superadmin was created for the smoke and deleted after the run
- login succeeded
- image file selection succeeded
- the UI posted to `/api/admin/media/library/create`
- the API returned HTTP 500 with body error `Access Denied`

This narrows the current production failure to the runtime S3 write boundary, not to the admin UI, session handling, or stale app image.

Runtime checks inside `repo-app-1` confirmed the deployed image contains the prefix fix:

- `lib/media/storage.js` has `createMediaStorageKey(..., prefix = "media")`
- `lib/admin/infra-health.js` probes `media/__health/sidebar/...`

Direct S3 probes with the production media credentials returned:

- current media bucket: `ecostroycontinent-media-ru3-20260327-probe1`
- `HeadBucket`: `403`
- `ListObjectsV2`: `AccessDenied:403`
- `PutObject` under root, `__health/`, `media/`, `uploads/`, and `public/media/`: all `AccessDenied:403`

Backup S3 credentials still list the backups bucket successfully, so the endpoint/network path is working. The broken boundary is specific to the media bucket credentials or provider-side media bucket policy.

Important correction for future agents: the code-level `media/` prefix fix is deployed and still correct as an application invariant, but it is not sufficient to restore upload while the production media S3 access key has no write/list permission on the configured media bucket. The next repair must rotate/restore media bucket credentials or policy in Selectel, then update `/opt/ecostroycontinent/runtime/.env` and restart/deploy the app. Do not switch media writes to the backup bucket as a shortcut.
