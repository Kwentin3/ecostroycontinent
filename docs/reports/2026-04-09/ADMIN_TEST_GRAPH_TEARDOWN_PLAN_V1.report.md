# ADMIN_TEST_GRAPH_TEARDOWN_PLAN_V1.report

## What This Plan Changes

The previous admin delete plan stays valid for draft and unreferenced test junk.

This new plan does **not** replace it. It covers the next failure mode that the delete tool cannot solve by itself:

- published test `Page/Service/Case/MediaAsset` graphs become operationally stuck;
- safe delete keeps refusing for correct reasons;
- rollback is not enough because it only works when another published revision already exists.

## What The New Plan Keeps

- strict delete safety;
- machine-readable test marking;
- narrow admin-only scope;
- no broad lifecycle platform;
- no weakening of published truth protections.

## What The New Plan Adds

- a distinct diagnosis: the real missing capability is published test-graph teardown, not softer delete;
- a narrow new operation: `Удалить тестовый граф` / test graph teardown;
- inclusion of `Page` only inside this special teardown path, not as ordinary delete target;
- a two-step model:
  1. deactivate published test truth;
  2. delete the graph in safe order.

## What Remains Explicitly Out

- general-purpose unpublish;
- archive-first platform;
- page bundle domain model;
- broad background cleanup system;
- weakening delete rules for ordinary published entities.

## Smallest Safe Next Step

The next safest implementation step is:

1. extend test marking to explicit test-page creation;
2. implement a teardown evaluator across `Page/Service/Case/MediaAsset`;
3. add a bounded internal capability to deactivate published truth for teardown-safe test graphs;
4. only then delete the graph using the existing safe delete engine.

## Recommendation

The next move should be a narrow implementation plan and execution for `test graph teardown`, not another round of general delete-tool expansion.
