# ADMIN_LEGACY_TEST_FIXTURE_NORMALIZATION_EXECUTION_v1

## What Was Implemented

Implemented one narrow corrective bridge for legacy test fixtures:

- admin-only action `Пометить как тестовые`;
- scope limited to `Page`, `Service`, and `Case`;
- persisted normalization into the real teardown marker path `creationOrigin = "agent_test"`;
- no parallel UI-only flag;
- no new delete path;
- no new live-deactivation path;
- no weakening of teardown safety.

The bridge exists only to let confirmed legacy fixtures enter the already existing `Удалить тестовый граф` path honestly.

## Where The Normalization Path Lives

Core implementation:

- [legacy-test-fixture-normalization.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/legacy-test-fixture-normalization.js)
- [content-types.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/content-types.js)
- [repository.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/repository.js)

UI / route entry points:

- [EntityEditorForm.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/EntityEditorForm.js)
- [normalize-test-fixture page](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/entities/[entityType]/[entityId]/normalize-test-fixture/page.js)
- [normalize-test-fixture route](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/api/admin/entities/[entityType]/[entityId]/normalize-test-fixture/route.js)

## How It Changes Teardown Eligibility

The bridge does one thing:

- updates the persisted entity origin from `null` or another non-test value to `agent_test`.

After that:

- the editor shows the `Тестовые` badge;
- the regular `Пометить как тестовые` action disappears;
- the existing `Удалить тестовый граф` entry point becomes available if the entity family is supported by teardown.

Normalization does **not**:

- delete the entity;
- deactivate published truth;
- clear review-state residue;
- bypass published-ref or draft-ref blockers;
- bypass teardown graph purity checks.

## Conditions And Confirmations

The bridge is intentionally narrow.

Implemented conditions:

- only `Page`, `Service`, `Case`;
- superadmin / publish-capable operator only;
- entity must not already be test-marked;
- explicit dry-run preview before execution;
- explicit confirmation dialog;
- explicit blocker list if normalization is unsafe.

Current normalization refusal logic blocks when:

- entity family is outside first-slice scope;
- entity does not exist;
- entity is already test-marked;
- there are incoming published non-test refs;
- there are incoming non-test draft refs.

Warnings are shown, but do not silently auto-fix:

- active published truth;
- review residue;
- open publish obligations;
- related route-owning targets without test marker.

## UI Entry Points Added

Added only to admin entity/detail editors for:

- `Page`
- `Service`
- `Case`

No list bulk tool was added.
No landing workspace action was added.
No broad provenance screen was added.

Operator flow:

1. open entity editor;
2. click `Пометить как тестовые`;
3. inspect dry-run;
4. confirm;
5. return to editor with success message and visible test-marked state.

## Auditability

Normalization records audit evidence through the existing audit pipeline using:

- `legacy_test_fixture_normalized`

Recorded data includes:

- entity id;
- previous `creationOrigin`;
- resulting `creationOrigin`;
- actor user id.

## Tests And Checks Run

Targeted tests:

```text
node --test tests/admin/legacy-test-fixture-normalization.test.js tests/admin/legacy-test-fixture-normalization.route.test.js
```

Regression subset:

```text
node --test tests/admin/legacy-test-fixture-normalization.test.js tests/admin/legacy-test-fixture-normalization.route.test.js tests/admin/live-deactivation.test.js tests/admin/live-deactivation.route.test.js tests/admin/test-graph-teardown.test.js tests/admin/test-graph-teardown.route.test.js tests/admin/entity-delete.test.js tests/admin/entity-delete.route.test.js
```

Project-wide checks:

```text
npm test
npm run build
```

All passed locally before rollout.

## Git Commits

Code commit:

- `0e2d73a` — `Add legacy test fixture normalization bridge`

This report is included in a follow-up docs commit.

## Push Status

- pushed to `origin/main`

## Deploy Status

Build:

- `build-and-publish` run `24213575144`

Deploy:

- `deploy-phase1` run `24213644220`

Pinned deployed image:

- `ghcr.io/kwentin3/ecostroycontinent-app@sha256:18fb4e536265244d5cddd3bf445ef30c77c750c02faac69a62744f2e8e4b0b8f`

## Known Limitations

- `MediaAsset` is intentionally out of the first normalization slice.
- Because teardown still traverses media, a normalized `Service` or `Case` can remain teardown-blocked by non-test media dependencies.
- Review-state residue is intentionally preserved; normalization does not auto-clean it.
- This bridge does not solve ordinary live deactivation or ordinary delete gaps; it only routes legacy fixtures into teardown eligibility.
