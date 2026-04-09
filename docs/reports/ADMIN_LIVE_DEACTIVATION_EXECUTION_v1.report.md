# ADMIN_LIVE_DEACTIVATION_EXECUTION_v1

## Scope

Implemented one narrow admin-only mechanism:

- `Вывести из живого контура`

This slice covers only ordinary non-test published:

- `Page`
- `Service`
- `Case`

It intentionally did **not** add:

- ordinary delete changes;
- test teardown changes;
- hard delete in the same flow;
- general unpublish / unpublish-to-null;
- archive or lifecycle platform work;
- `MediaAsset` / `Gallery` deactivation.

## Grounding Summary

Before this change the system already had:

- ordinary safe delete for narrow non-live cases;
- test-marked published graph teardown for pure test graphs;
- protected published truth through active published pointers;
- public read-side routes that resolve directly from published truth:
  - `/about`
  - `/contacts`
  - `/services/[slug]`
  - `/cases/[slug]`

What was still missing was an ordinary, non-test mechanism for taking one live entity out of the public contour without deleting history and without piggybacking on test teardown.

## What Was Implemented

### 1. Live-deactivation logic

Added:

- `lib/admin/live-deactivation.js`

The new service defines one separate primitive:

- ordinary live deactivation

The service:

- supports only `page`, `service`, and `case`;
- refuses test-marked roots and points them back to test graph teardown;
- refuses entities that are already non-live;
- refuses entities with active `review` revisions;
- refuses entities with open publish obligations;
- refuses surviving incoming published refs;
- refuses surviving incoming non-test draft refs;
- computes route/public-side effects before execution;
- clears only the active published pointer;
- preserves entity and revision history.

### 2. Audit evidence

Added audit support:

- `lib/content-core/content-types.js`
  - `AUDIT_EVENT_KEYS.LIVE_DEACTIVATED`

Execution records an explicit audit event instead of silently mutating the live pointer.

### 3. Admin route and dry-run

Added:

- preview page:
  - `app/admin/(console)/entities/[entityType]/[entityId]/live-deactivation/page.js`
- execution route:
  - `app/api/admin/entities/[entityType]/[entityId]/live-deactivation/route.js`

The preview now shows:

- root entity;
- current live/published state;
- route impact;
- public-side outcome;
- list impact;
- sitemap note;
- revalidation paths;
- incoming published refs;
- incoming non-test draft refs;
- explicit blockers or warnings.

Execution only becomes available after this dry-run and a second operator confirmation.

### 4. UI entry points

Added compact entry points in ordinary admin entity surfaces:

- `components/admin/EntityEditorForm.js`

Behavior:

- `Page`, `Service`, and `Case` editors now show `Вывести из живого контура` only when:
  - the entity exists;
  - the user can publish;
  - there is active published truth;
  - the entity is not test-marked.

Also added non-live visibility:

- `lib/admin/list-visibility.js`

List rows now show `Вне live` when the latest revision is published but the active live pointer has already been cleared.

### 5. Public-side and revalidation semantics

The implementation now handles public-side side effects explicitly:

- `Page`
  - `/about` or `/contacts` becomes `404` if no replacement exists;
  - route is removed from live contour;
  - page leaves published sitemap participation if sitemap is driven from published truth;
  - route revalidation runs.
- `Service`
  - `/services/[slug]` becomes non-live / `404`;
  - service leaves live listing participation;
  - route and list revalidation run.
- `Case`
  - `/cases/[slug]` becomes non-live / `404`;
  - case leaves live listing participation;
  - route and list revalidation run.

The current codebase does not expose a dedicated runtime sitemap route, so sitemap effect is represented honestly in preview language rather than faked as a concrete endpoint mutation.

## Refusal Rules

The mechanism refuses when:

- the entity family is outside `Page` / `Service` / `Case`;
- the root is test-marked;
- there is no active published truth;
- there is an active `review` revision;
- there are open publish obligations;
- a surviving published entity still points at the target;
- a surviving non-test draft still points at the target;
- the route/public consequence cannot be classified safely.

Refusal messages are operator-readable and no fallback action is executed.

## Tests and Checks

Added:

- `tests/admin/live-deactivation.test.js`
- `tests/admin/live-deactivation.route.test.js`

Checks run:

- `node --test tests/admin/live-deactivation.test.js tests/admin/live-deactivation.route.test.js tests/admin/entity-delete.test.js tests/admin/entity-delete.route.test.js tests/admin/test-graph-teardown.test.js tests/admin/test-graph-teardown.route.test.js`
- `npm test`
- `npm run build`

All passed.

## Git

- Code commit: `1cae387` — `Implement admin live deactivation first slice`
- Push status: pushed to `origin/main`

## Rollout

- `build-and-publish` run `24210419740` succeeded
- built image:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:e35d13cab3f41cfedf00214177086561e64b6e517dadc1426a47b1a024d255a8`
- `deploy-phase1` run `24210494826` succeeded

Post-deploy host verification showed the runtime container already using the new image, but `/opt/ecostroycontinent/runtime/.env` still pointed to the previous digest. The host env pin was then corrected manually so the persisted host state and running container now match.

## Known Limitations

- This slice does not hard-delete anything after deactivation.
- `MediaAsset` and `Gallery` remain outside ordinary live deactivation.
- Test-marked published objects must still go through test graph teardown.
- Surviving non-test drafts are treated as blockers in this first slice rather than warnings.
- There is still no general editorial unpublish feature, by design.
