# ADMIN_TEST_GRAPH_TEARDOWN_REALITY_CHECK_v1

## Runtime Reality

The mechanism is real, deployed, and reachable through admin operational surfaces.

New live seams:

- preview page:
  - `/admin/entities/[entityType]/[entityId]/test-graph-teardown`
- execution route:
  - `/api/admin/entities/[entityType]/[entityId]/test-graph-teardown`

Relevant editor/workspace entry points now surface `Удалить тестовый граф` for test-marked objects:

- `page`
- `service`
- `case`
- `media_asset`

## What Is Fully Aligned

### 1. Test page marking is now real

- explicit test page creation is supported through the page admin list;
- the marker is persisted through the normal entity save path;
- no title/name heuristic is used.

### 2. Pure test graph teardown is real

The deployed mechanism now supports:

- dry-run evaluation from a test-marked root;
- inclusion of linked `Page` / `Service` / `Case` / `MediaAsset` members;
- teardown-only deactivation of published pointers for pure test graphs;
- dependency-aware delete after deactivation.

### 3. Mixed graph refusal is real

The evaluator refuses when:

- non-test published truth points into the graph;
- non-test draft truth points into the graph;
- the graph contains a non-test in-scope member;
- an out-of-scope `Gallery` dependency is encountered;
- a graph member still has `review` revisions.

Refusal reasons are surfaced in operator-readable language on the dry-run screen and route feedback.

### 4. Ordinary delete stayed strict

The ordinary delete path remains narrow:

- still limited to its original `media_asset` / `service` / `case` scope;
- still denies published/live truth;
- still does not become a hidden unpublish;
- still does not allow `Page` delete as an everyday action.

## What Remains Partial

- `Gallery` teardown is intentionally not implemented in this slice.
- Review-state test graphs are refused rather than auto-normalized.
- The deploy workflow still leaves host `.env` pin drift and needed manual correction again in this rollout.

## Safety Boundary Check

The important product/ops boundaries remain intact:

- `Page` stays protected outside the pure test teardown path.
- Published truth for ordinary/non-test objects stays protected.
- No general unpublish/unpublish-to-null feature leaked into the editor.
- No broad lifecycle/archive platform was introduced.
- No destructive entry point was added to landing workspace.

## Deployment Check

- `build-and-publish` run `24207656594` succeeded
- `deploy-phase1` run `24207739926` succeeded
- live image target:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:80d1d18df877def31f33c19e8d1fd08e5197288fbd52944ce390bd2560f06726`
- VM runtime env was manually corrected to the same digest
- public health endpoint returned:
  - `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`

## Verdict

The new slice is honest enough for operator testing now:

- pure test graph teardown works;
- mixed graphs are refused;
- ordinary delete remains strict;
- `Page` is only destructible inside the explicit pure-test teardown path.

## Smallest Safe Next Step

Do not broaden into general unpublish.

The next smallest safe step is:

1. operator-test the pure-graph path with one synthetic `Page -> Service -> Case -> MediaAsset` chain;
2. operator-test one mixed-graph refusal case with a non-test page referencing a test service;
3. only after that decide whether `Gallery` is a real blocker for the next slice or can stay out.
