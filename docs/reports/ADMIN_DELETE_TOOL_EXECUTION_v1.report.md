# ADMIN_DELETE_TOOL_EXECUTION_v1

## Scope

Implemented the first narrowed admin delete slice for `media`, `service`, and `case`:

- persisted test marker `creationOrigin = "agent_test"`;
- conservative safe-delete decision layer with explicit refusal reasons;
- test-data filter and bulk delete path;
- ordinary entity delete path for human operators;
- DB migration, route wiring, UI wiring, and focused regression coverage.

This execution intentionally did **not** broaden into:

- archive/lifecycle platform work;
- `Page` deletion;
- grouped page-bundle cleanup;
- naming-based test detection;
- landing-workspace composition delete actions.

## Grounding Summary

The current repo already had:

- generic entity save flow for `service` / `case`;
- media create flow through the media library route;
- published/draft card listing helpers;
- aggregate/revision access in `content-core`;
- no persisted origin marker on `content_entities`;
- no single safe delete route for `media`, `service`, and `case`.

The narrowest honest seam was therefore:

1. extend `content_entities` with a single optional origin marker;
2. only stamp that marker on explicit agent/test creation flows;
3. build one conservative delete-assessment layer over existing aggregate/card/publish helpers;
4. surface delete in existing list/editor/media-workspace screens.

## What Was Implemented

### 1. Persisted marker

Added `content_entities.creation_origin` through:

- `db/migrations/003_entity_creation_origin.sql`

Added marker normalization helpers:

- `lib/admin/entity-origin.js`

Supported value in this first slice:

- `agent_test`

No broader provenance taxonomy was introduced.

### 2. Marker write paths

Explicit agent/test marker support was added to:

- `app/api/admin/entities/[entityType]/save/route.js`
- `app/api/admin/media/library/create/route.js`
- `lib/content-core/service.js`
- `lib/content-core/repository.js`

Important behavior:

- the marker is only persisted when an explicit creation flow passes `creationOrigin=agent_test`;
- normal editorial create/save flows remain unmarked;
- existing entities are not retroactively reclassified.

### 3. Safe-delete engine

Added:

- `lib/admin/entity-delete.js`
- `app/api/admin/entities/[entityType]/delete/route.js`

Supported entity types:

- `media_asset`
- `service`
- `case`

Core deny rules implemented:

- active published truth;
- active review/publish participation;
- references from published objects;
- references from non-test drafts;
- test-only bulk delete refusing non-test rows.

Reference scans were implemented conservatively against:

- `gallery`
- `service`
- `case`
- `page`

including landing-first page composition references inside `blocks`.

### 4. UI paths

Implemented list/detail delete affordances in existing admin surfaces:

- `app/admin/(console)/entities/[entityType]/page.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/MediaGalleryWorkspace.js`
- `components/admin/admin-ui.module.css`
- `lib/admin/list-visibility.js`
- `lib/admin/media-gallery.js`

Delivered operator-facing behavior:

- `Только тестовые` filter;
- test badges/used markers in lists;
- multi-select + `Удалить тестовые` bulk action;
- explicit `Удалить` action for ordinary entity attempts;
- operator-readable refusal messages instead of raw DB errors.

### 5. Supporting tests

Added/updated:

- `tests/admin/entity-save.route.test.js`
- `tests/admin/media-library-create.route.test.js`
- `tests/admin/entity-delete.test.js`
- `tests/admin/entity-delete.route.test.js`
- `tests/admin/list-visibility.test.js`

Covered areas:

- explicit agent-test marker set on test flow;
- normal create remains unmarked;
- safe delete allow/deny outcomes;
- bulk delete summary behavior;
- test-row surfacing in list projections.

## Checks Run

- `node --experimental-specifier-resolution=node --test tests/admin/entity-save.route.test.js tests/admin/media-library-create.route.test.js tests/admin/entity-delete.test.js tests/admin/entity-delete.route.test.js tests/admin/list-visibility.test.js`
- `npm test`
- `npm run build`

All passed.

## Git Status

- Code commit: `77277b0` — `Implement admin delete tool first slice`
- Push status: pushed to `origin/main`

## Rollout Status

### Migration

Applied on the live VM through the canonical compose-network path:

- `npm run db:migrate` executed inside a compose-connected app container against the live SQL runtime
- migration output confirmed:
  - `Applied migration 003_entity_creation_origin.sql`

### Build and deploy

- `build-and-publish` run `24200583018` succeeded
- built image digest:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:952e5f8a93fac2e621f3f71810681fad61d210bb8e4f7a8e3c7dfbb2f2bdc0bf`
- `deploy-phase1` run `24200736549` succeeded

### Host correction

During post-check, the deploy workflow was found to leave `/opt/ecostroycontinent/runtime/.env` with stale `APP_IMAGE=...:latest` even though the running container used the pinned digest through shell override.

To keep the host runtime honest, the host env file was corrected manually after deploy so that:

- host `.env` pin;
- running app container image;
- deployed GHCR digest

all match the same digest.

## Known Limitations

- First slice remains intentionally limited to `media`, `service`, and `case`.
- `Page` deletion is still out of scope.
- No archive-first subsystem was added.
- No grouped test-bundle cleanup was added.
- Refusal reasons are covered by tests and route behavior, but no separate live authenticated operator clickthrough was run in this execution pass.
- The existing deploy workflow should later be patched so host `.env` pinning is reliable without manual correction.
