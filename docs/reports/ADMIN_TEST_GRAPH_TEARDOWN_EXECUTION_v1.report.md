# ADMIN_TEST_GRAPH_TEARDOWN_EXECUTION_v1

## Scope

Implemented one narrow operational mechanism:

- `test-marked published graph teardown`

This slice intentionally did **not** add:

- general unpublish;
- general retire/deactivate;
- archive-platform work;
- `Page` delete as an ordinary editor action;
- workspace-level destructive actions.

## Grounding Summary

Before this change the repo already had:

- persisted `creationOrigin = "agent_test"` for explicit test create flows on `media`, `service`, and `case`;
- strict ordinary delete for `media_asset`, `service`, and `case`;
- publish truth protection through `activePublishedRevisionId`;
- no safe path for tearing down a pure published test graph;
- no explicit test-page create path.

The narrowest honest seam was therefore:

1. extend explicit test marking to test `Page` creation;
2. add a graph evaluator over `Page` / `Service` / `Case` / `MediaAsset`;
3. add a teardown-only published-pointer deactivation primitive;
4. reuse ordinary safe delete after deactivation in dependency-aware order;
5. keep mixed-graph refusal explicit.

## What Was Implemented

### 1. Test `Page` marking

Added explicit test-page create support in the existing page admin flow:

- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/new/page.js`
- `components/admin/EntityEditorForm.js`

Behavior:

- page lists now expose `Новая тестовая страница`;
- the create flow carries `creationOrigin=agent_test`;
- ordinary page creation remains unmarked.

### 2. Graph evaluator

Added:

- `lib/admin/test-graph-teardown.js`

Evaluator scope in this first slice:

- `Page`
- `Service`
- `Case`
- `MediaAsset`

The evaluator:

- starts from one selected test-marked root;
- expands across in-scope outgoing and incoming references;
- always includes `Page` in evaluation when it belongs to the graph;
- classifies the graph as allowed or mixed/unsafe;
- refuses if:
  - the root is not test-marked;
  - any targeted member is not test-marked;
  - a non-test published object points into the graph;
  - a non-test draft points into the graph;
  - a member has active review-state revisions;
  - the graph depends on an out-of-scope `Gallery` edge.

### 3. Dry-run / preview surface

Added:

- `app/admin/(console)/entities/[entityType]/[entityId]/test-graph-teardown/page.js`

The preview shows:

- root entity;
- included graph members;
- which members are published;
- which members will have published truth deactivated;
- which members will be deleted;
- blocking reasons when the graph is mixed or otherwise unsafe.

This is a bounded dry-run list, not a graph explorer.

### 4. Teardown-only published-truth deactivation

Added a narrow internal primitive:

- `lib/content-core/repository.js`
  - `clearEntityActivePublishedRevision(...)`

Important boundary:

- this is used only inside teardown execution for pure test graphs;
- it is **not** surfaced as ordinary editorial unpublish;
- ordinary delete behavior remains unchanged in spirit.

### 5. Dependency-aware delete execution

Extended delete internals so teardown can reuse them inside one transaction:

- `lib/admin/entity-delete.js`
  - extracted `deleteEntityWithSafetyInDb(...)`

Teardown execution:

- runs graph evaluation first;
- completes open publish obligations for the pure test graph;
- clears published pointers only for evaluated pure test members;
- deletes `Page` directly only inside the pure-test teardown path;
- deletes `service` / `case` / `media_asset` through the existing safety engine;
- preserves best-effort media storage cleanup after commit.

### 6. Admin entry points

Added narrow operator entry points:

- `components/admin/EntityEditorForm.js`
  - test badge + `Удалить тестовый граф` for test `page` / `service` / `case`
- `components/admin/MediaGalleryWorkspace.js`
  - `Удалить тестовый граф` action for test media in the inspector

No entry point was added to the landing workspace.

## Tests and Checks

Focused additions:

- `tests/admin/entity-save.route.test.js`
- `tests/admin/test-graph-teardown.test.js`
- `tests/admin/test-graph-teardown.route.test.js`

Checks run:

- `node --test tests/admin/entity-save.route.test.js tests/admin/test-graph-teardown.test.js tests/admin/test-graph-teardown.route.test.js tests/admin/entity-delete.test.js tests/admin/entity-delete.route.test.js`
- `npm test`
- `npm run build`

All passed.

## Git

- Code commit: `1c2e654` — `Implement test graph teardown flow`
- Push status: pushed to `origin/main`

## Rollout

- `build-and-publish` run `24207656594` succeeded
- built image:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:80d1d18df877def31f33c19e8d1fd08e5197288fbd52944ce390bd2560f06726`
- `deploy-phase1` run `24207739926` succeeded

Post-deploy host correction:

- the workflow again left `/opt/ecostroycontinent/runtime/.env` on the previous pinned digest;
- the host env file was corrected manually on the VM to the new digest;
- `repo-app-1` confirms:
  - `Config.Image = ghcr.io/kwentin3/ecostroycontinent-app@sha256:80d1d18df877def31f33c19e8d1fd08e5197288fbd52944ce390bd2560f06726`

Live health:

- `https://ecostroycontinent.ru/api/health` returned `200 OK`

## Known Limitations

- Mixed graphs are refused completely; no partial dismantling is attempted.
- `Gallery` remains outside this teardown slice and blocks teardown if it participates in the graph.
- Members with active `review` revisions are refused rather than auto-cleaned.
- Ordinary/non-test published truth still has no general unpublish flow, by design.
- The deploy workflow still needs a later fix so host `.env` pinning is reliable without manual correction.
