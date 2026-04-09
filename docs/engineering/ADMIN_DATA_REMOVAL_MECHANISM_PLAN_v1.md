# ADMIN_DATA_REMOVAL_MECHANISM_PLAN_v1

## 1. Why This Plan Is Being Narrowed

The previous version diagnosed the problem correctly but still framed too much of the broader removal landscape at once.

That is not the right next execution target.

For the current phase, we should keep exactly three positions:

- ordinary safe delete remains as-is;
- delete must stay strict;
- the real next blocked operator case is published test graph teardown.

Everything else should be treated as future discussion unless a concrete blocking case appears in the live admin.

## 2. Current Reality

The current delete tool already does the right thing for its intended scope:

- it deletes safe non-live `media`, `service`, and `case` rows;
- it cleans obvious `agent_test` junk;
- it refuses deletion when published/live truth or non-test references would break.

That behavior should not be weakened.

The current operational pain is different:

- we create test `Page`, `Service`, `Case`, and `MediaAsset` objects;
- we connect them;
- we publish them to validate the real contour;
- the graph becomes published truth;
- ordinary delete then correctly refuses.

So the missing capability is not broader delete.

The missing capability is:

- safe teardown of a pure test-marked published graph.

## 3. Tight Taxonomy For The Next Slice

Only two categories matter for the next implementation step.

### A. Keep As-Is — Ordinary Safe Delete

This already covers:

- unpublished unused junk;
- isolated draft objects;
- test-marked rows that never became protected live truth.

No redesign is needed here.

### B. Add Now — Published Test Graph Teardown

This is the real next problem.

It covers:

- test-marked objects that were legitimately published;
- linked graphs such as `Page + Service + Case + MediaAsset`;
- refusal from ordinary delete because the graph is live;
- need to dismantle the graph without weakening published-truth protections for ordinary objects.

## 4. What The Next Slice Is Explicitly Not

The next slice is **not**:

- a general removal/lifecycle model for the whole product;
- general retire/deactivate for ordinary published entities;
- broader archive expansion;
- general-purpose unpublish/unpublish-to-null;
- a platform answer to every future removal case.

Those topics may become relevant later, but they are not the next execution target.

## 5. Narrow Goal

The goal of the next slice is:

- allow teardown of a pure test-marked published graph;
- keep ordinary published truth strongly protected;
- refuse mixed graphs explicitly;
- keep `Page` protected unless the graph is clearly pure test and safe.

## 6. Required Teardown Model

The next slice should implement one bounded flow only.

### Step 1 — Explicit test marking extended to `Page`

The system already uses `creationOrigin = "agent_test"` for explicit test creation flows.

The next slice must extend that marker to explicit test `Page` creation flows as well.

This is required because `Page` must participate in graph evaluation.

No name heuristics, no chat memory, no inferred test-ness.

### Step 2 — Graph evaluation starting from a test-marked root

The flow should start from one chosen test-marked root entity and traverse the relevant linked graph across:

- `Page`
- `Service`
- `Case`
- `MediaAsset`

The evaluator must classify graph members as:

- pure test and teardown-safe;
- mixed / unsafe;
- outside teardown scope.

`Page` must always participate in evaluation, even if it is not ultimately deleted.

### Step 3 — Graph preview / dry-run before destructive execution

Before anything destructive happens, the operator should see a bounded preview:

- what objects are in scope;
- which ones are published;
- which ones would be removed;
- which ones block teardown;
- whether the graph is mixed with non-test truth.

This is not a visual graph tool.

It is a dry-run / preview list for one teardown action.

### Step 4 — Strict refusal for mixed graphs

If the graph is mixed with non-test live or non-test draft truth, teardown must stop.

Examples of refusal conditions:

- a non-test published `Page` points to a test `Service`;
- a non-test draft `Case` still references a test `MediaAsset`;
- a route-owning entity in the graph is not test-marked;
- teardown would leave broken published references behind.

The refusal must stay explicit and operator-readable.

### Step 5 — Teardown-only published-truth deactivation

This is the missing primitive today.

It must be described narrowly as:

- teardown-only internal deactivation of published truth for pure test-marked graph members.

It must **not** be framed as:

- general unpublish;
- ordinary editorial unpublish-to-null;
- broad lifecycle action for the whole system.

This primitive exists only so a pure test graph can leave the live contour safely before deletion.

### Step 6 — Safe dependency-aware delete after deactivation

Only after successful deactivation should existing safe delete machinery remove graph members.

Deletion order should be dependency-aware rather than naive.

At minimum, the mechanism must avoid leaving:

- broken route owners;
- broken published refs;
- broken surviving draft refs.

## 7. Entity Scope For This Slice

### `Page`

- must always participate in graph evaluation;
- may participate in deletion only if the graph is clearly pure test-marked and safe.

### `Service`

- participates in evaluation;
- may be deactivated and deleted only inside teardown-safe pure test graph.

### `Case`

- participates in evaluation;
- may be deactivated and deleted only inside teardown-safe pure test graph.

### `MediaAsset`

- participates in evaluation;
- may be deleted after deactivation of graph truth if still safe.

### `Gallery`

- out of the immediate next slice unless a concrete blocking test graph proves it is required.

## 8. Operator UI For This Slice

Keep the UI small and operational.

The next slice needs only:

1. existing test markers / test filters;
2. one explicit action such as `Удалить тестовый граф`;
3. one teardown preview / dry-run;
4. one explicit refusal surface when the graph is mixed or unsafe.

Do not add this into landing workspace.

Do not build a broad lifecycle console.

## 9. Safety Boundaries

The following boundaries remain hard:

- ordinary published truth remains protected;
- ordinary delete does not become softer;
- mixed graphs are refused, not partially dismantled by default;
- `Page` is not treated like an ordinary delete target;
- teardown-only deactivation does not become a disguised general unpublish feature.

## 10. What Was Removed From The Broader Version

The broader framing explicitly removed from the next slice:

- general retire/deactivate for ordinary published entities;
- broader archive expansion;
- general removal taxonomy as an implementation roadmap;
- broader handling of “published but obsolete product truth”;
- “everything removal eventually” framing.

Those may still be real topics later, but they are not part of the immediate next execution slice.

## 11. Smallest Safe Implementation Step

The smallest safe step after this plan is:

1. extend explicit test marking to test `Page` creation flows;
2. implement graph evaluation from a test-marked root across `Page/Service/Case/MediaAsset`;
3. implement teardown preview / dry-run;
4. refuse mixed graphs explicitly;
5. add teardown-only internal published-truth deactivation for pure test graph members;
6. reuse existing safe delete machinery for dependency-aware removal after deactivation.

## 12. Additional Notes / My View

- The current delete tool should not be blamed for this problem. It is blocking the right things.
- The real design mistake now would be to broaden delete until it behaves like hidden unpublish.
- The second mistake would be to jump straight into a full lifecycle platform.
- The clean middle path is narrower: keep delete strict, add one teardown-only internal primitive, and use it only for pure test-marked graphs.
