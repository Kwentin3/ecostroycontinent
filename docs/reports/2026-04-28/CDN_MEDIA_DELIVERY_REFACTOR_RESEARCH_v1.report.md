# CDN_MEDIA_DELIVERY_REFACTOR_RESEARCH v1

Date: 2026-04-28
Scope: Selectel CDN readiness, media delivery refactor preparation, production safety plan

## Summary

Media upload and app-proxy image delivery are healthy again. CDN delivery is still not ready to switch on.

The current simple picture:

- The app writes and reads media through S3 credentials.
- Public/admin previews currently work through the app proxy route.
- CDN can only fetch from a public origin.
- The old CDN resource still points at the old public origin documented in March.
- The active media bucket is now `ecostroycontinent-media-ru3-20260428`, so the old CDN origin is stale.
- The new bucket is marked `public` by the Selectel Object Storage API, but no custom domains are attached and S3-style public reads still return `403`.
- The old default CDN domain currently returns `502` for object paths.

Do not switch production to CDN until an object-level origin probe and CDN probe both pass.

## Current Production Facts

Runtime media env, redacted to non-secret fields:

- `MEDIA_STORAGE_MODE=s3`
- `MEDIA_S3_BUCKET=ecostroycontinent-media-ru3-20260428`
- `MEDIA_S3_ENDPOINT_URL=https://s3.ru-3.storage.selcloud.ru`
- `MEDIA_S3_REGION=ru-3`
- `MEDIA_PUBLIC_BASE_URL=` is empty
- `MEDIA_DELIVERY_MODE` is not injected and therefore defaults to `app_proxy`
- `MEDIA_S3_LOCAL_FALLBACK_ENABLED` is not injected and therefore defaults to `false`

Live app proxy probe:

- `https://ecostroycontinent.ru/api/media-public/entity_193254fe-2ef2-4dba-b10a-c16c694e7557`
- result: `200`, `image/webp`

Current bucket metadata through Selectel Object Storage API:

- bucket: `ecostroycontinent-media-ru3-20260428`
- `general.type=public`
- custom domain count: `0`

Public S3-style reads against a known object still returned `403`:

- `https://s3.ru-3.storage.selcloud.ru/ecostroycontinent-media-ru3-20260428/<object-key>`
- `https://ecostroycontinent-media-ru3-20260428.s3.ru-3.storage.selcloud.ru/<object-key>`

Old CDN default domain probes:

- `https://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/cdn-probe.txt` -> `502`
- `https://fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net/<known-media-key>` -> `502`

Published media currently include legacy root-level object keys, for example:

- `98e9ae65-72a2-4ce1-97ae-9a06c1351b38.jpeg`
- `840b8fa9-fd07-4113-9c9c-59a3bfe46d41.webp`

New uploads use the safer `media/...` prefix. CDN must serve both existing root-level legacy keys and new `media/...` keys unless a separate key migration is explicitly planned.

## Code Facts

Relevant code paths:

- `lib/media/public-delivery.js`
  - `MEDIA_DELIVERY_MODE=app_proxy`: always uses `/api/media-public/:entityId`.
  - `MEDIA_DELIVERY_MODE=cdn`: uses `MEDIA_PUBLIC_BASE_URL/<storageKey>` when present.
  - `MEDIA_DELIVERY_MODE=auto`: probes CDN by `HEAD` and falls back to app proxy on failure.
- `lib/config.js`
  - CDN/auto delivery requires `MEDIA_PUBLIC_BASE_URL`.
  - default delivery mode is `app_proxy`.
- `app/api/media-public/[entityId]/route.js`
  - reads published media metadata, resolves delivery, and can serve bytes through the app proxy.
- `lib/admin/infra-health.js`
  - CDN health currently checks `MEDIA_PUBLIC_BASE_URL/<firstObjectKey>`.

The app already has the right kill switch shape. The infrastructure side must prove CDN object fetches before enabling the env pair:

```text
MEDIA_PUBLIC_BASE_URL=https://<healthy-cdn-host>
MEDIA_DELIVERY_MODE=auto
```

Use `auto` first. Only consider `cdn` after a sustained healthy period.

## Official Selectel Findings

Selectel documentation relevant to this refactor:

- CDN resources are created with a source/origin address, and Selectel notes that for Object Storage the bucket must be public.
- The Object Storage source address is the bucket main domain ending in `selstorage.ru`; the create-resource UI asks for that address without `https://`.
- If the CDN source is configured by IP or domain, the Host header sent to the source must match what the origin expects.
- CDN cache can need manual purge after source/object changes.
- CDN resource status should be checked before relying on the delivery hostname.
- Current public API URL documentation lists many API groups but does not expose the old March CDN API path used in our runbook.
- The old runbook endpoint `https://api.selectel.ru/cdn/v2/projects/.../resources/...` now redirects to Selectel API docs HTML instead of returning CDN JSON from this operator path.

Source docs:

- https://docs.selectel.ru/en/cdn/create-resource/
- https://docs.selectel.ru/en/cdn/quickstart/
- https://docs.selectel.ru/en/cdn/source/manage-host-header/
- https://docs.selectel.ru/en/cdn/content/cleanup-cache/
- https://docs.selectel.ru/en/cdn/resources/check-resource-status/
- https://docs.selectel.ru/en/s3/manage/domains/
- https://docs.selectel.ru/en/api/authorization/
- https://docs.selectel.ru/en/api/urls/
- https://docs.selectel.ru/en/api/object-storage/

## Working Diagnosis

The current problem is not S3 write permissions anymore.

The current problem is the public delivery chain:

1. Production media now lives in the new bucket.
2. App proxy can read the bucket because the app has S3 credentials.
3. CDN cannot use those app credentials; it needs a public origin URL.
4. The existing CDN resource is still wired to the old public origin from the March runbook.
5. The new bucket's main public origin hostname is not yet confirmed in code/docs/API output.
6. Direct S3 endpoint reads are not the same as the Selectel public bucket main domain and currently return `403`.

In plain words: the backend has the key to the warehouse again, but the CDN is still driving to the old loading dock.

## Refactor Plan

### Phase 0 - Freeze the safe baseline

- Keep production on `MEDIA_DELIVERY_MODE=app_proxy`.
- Keep `MEDIA_PUBLIC_BASE_URL` empty.
- Keep local fallback disabled.
- Do not change media SQL `storageKey` values.
- Do not point uploads or storage writes at CDN URLs.

### Phase 1 - Establish a canary origin

Create or choose two canary objects in the current bucket:

- `cdn-probe.txt` or `media/__cdn-canary/<timestamp>.txt`
- one existing published legacy root key

For each key, prove:

- authenticated S3 `HeadObject` succeeds;
- unauthenticated public origin `HEAD`/`GET` succeeds through the bucket main `*.selstorage.ru` domain;
- returned content type and bytes are sane.

Blocking item: obtain or attach the current bucket public origin domain. Options:

- read the new bucket's generated main domain from the Selectel control panel;
- find a supported API endpoint for the generated main domain;
- attach a project-owned custom origin hostname to the bucket, then use that as CDN source.

### Phase 2 - Fix or recreate the CDN resource

Use the existing CDN resource only if it can be safely updated:

- name: `ecostroycontinent-media-cdn`
- id: `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd`
- default domain: `fa6a2ae8-bf2b-4ef8-9ef8-86cf1957bcfd.selcdn.net`

Required CDN settings:

- source/origin: current bucket public main domain, without `https://`;
- source Host header: same hostname as the origin;
- path: object keys must map directly, without losing root-level legacy keys or the `media/` prefix;
- protocol: HTTPS if Selectel confirms healthy HTTPS to origin; otherwise document the exact provider-supported setting.

After changing origin/host:

- wait until resource status is active;
- purge CDN cache for the canary keys;
- verify CDN `HEAD` and `GET` for HTTP and HTTPS object paths.

If the current resource cannot be updated through a current supported API or panel workflow, recreate it and update docs with the new resource id/domain.

### Phase 3 - Enable app CDN delivery safely

Only after Phase 2 passes:

1. Set `MEDIA_PUBLIC_BASE_URL=https://<healthy-cdn-host>`.
2. Set `MEDIA_DELIVERY_MODE=auto`.
3. Restart the app container.
4. Verify:
   - public pages show no broken images;
   - `/api/media-public/:entityId` still returns `200`;
   - CDN canary object returns `200`;
   - admin infra sidebar reports CDN ok;
   - admin media previews still work.

Do not start with `MEDIA_DELIVERY_MODE=cdn`. `auto` preserves the app proxy fallback if CDN starts returning `502` again.

### Phase 4 - Code hardening follow-up

Recommended app-side hardening before or during rollout:

- Add a unit test that `resolvePublicMediaDelivery()` falls back to app proxy when CDN `HEAD` fails.
- Keep public read-side URLs based on `/api/media-public/:entityId`; do not expose raw CDN URLs as canonical content refs.
- Consider making `getMediaDeliveryUrl()` mode-aware, because today it can derive a raw CDN URL whenever `MEDIA_PUBLIC_BASE_URL` exists.
- Improve `lib/admin/infra-health.js` to probe a known fresh canary object instead of the first arbitrary object in the bucket.

## Rollback

Rollback is simple as long as storage keys are not rewritten:

```text
MEDIA_PUBLIC_BASE_URL=
MEDIA_DELIVERY_MODE=app_proxy
```

Restart the app after changing env. Public delivery returns to the app proxy path, which is confirmed healthy today.

## Readiness Checklist

- [ ] Current bucket generated public main domain is known.
- [ ] Public origin `HEAD`/`GET` works for a canary under `media/...`.
- [ ] Public origin `HEAD`/`GET` works for at least one legacy root-level published key.
- [ ] CDN resource origin points to the current bucket origin.
- [ ] CDN Host header matches the origin host.
- [ ] CDN cache is purged for canary paths after origin changes.
- [ ] CDN HTTP and HTTPS object probes return `200`.
- [ ] `MEDIA_DELIVERY_MODE=auto` smoke passes on production.
- [ ] Runbook replaces stale CDN API endpoint instructions with the current supported workflow.

