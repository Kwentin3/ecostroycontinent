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
