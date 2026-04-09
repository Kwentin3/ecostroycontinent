# ADMIN_TEST_GRAPH_TEARDOWN_PLAN_v1

## 1. Why This Plan Exists

The current first-slice delete tool solved only the narrowest part of the cleanup problem:

- unpublished, unreferenced test `media`, `service`, and `case` can now be removed;
- human operators can attempt deletion through UI;
- the system can refuse with explicit reasons instead of failing silently.

That was the right first step.

But it does not solve the harder and now very visible operational reality of the current phase:

- we are actively building the product;
- we create test `media`, `service`, `case`, and `page` objects;
- we connect them to each other;
- we sometimes publish those test revisions to exercise the real contour;
- those published test objects then become practically undeletable because they legitimately participate in published truth.

This is not an abnormal edge case. It is a normal by-product of the current delivery phase.

The problem is no longer "delete is missing".

The real problem is:

- there is no narrow system path for tearing down a published test graph safely.

## 2. Summary Diagnosis

### What the current system already does correctly

- Published truth is protected.
- Route-owning entities are not casually destroyed.
- Delete safety checks are conservative and reference-aware.
- The admin does not silently remove objects that are still live.

### What the current system does not do yet

- It cannot unpublish an entity to `null`.
- It can only roll back to another already published revision.
- It has no test-graph-aware teardown flow.
- It treats a published test object and a published real object almost identically at delete time.

### Why this is now painful

Test objects are not isolated.

A realistic test run often creates a connected graph such as:

- test `Page`
- test `Service`
- test `Case`
- test `MediaAsset`
- published references between them

Once that graph reaches published state, the current delete tool sees real published references and correctly refuses deletion. That keeps the system safe, but leaves the operator with no cleanup path.

## 3. Anamnesis

### Phase 1 — Normal draft cleanup need

At first, the observed problem was simple:

- agent-created test objects polluted admin lists;
- operators needed a fast way to remove obvious junk;
- a narrow safe-delete path for `media`, `service`, and `case` was sufficient.

That led to the current delete-tool slice.

### Phase 2 — Real contour testing

As the product moved into real runtime verification and UI execution, testing became closer to production behavior:

- test entities were not only created;
- they were linked together;
- they were reviewed and published to validate real behavior.

This changed the cleanup problem fundamentally.

### Phase 3 — Published test graph lock-in

Now the pain is not primarily "I cannot delete a draft".

The pain is:

- a test object was legitimately published;
- other test objects legitimately reference it;
- delete correctly refuses because the graph looks live;
- rollback is insufficient because it requires another published revision;
- there is no bounded tool whose job is to dismantle a test-only published graph.

So the delete tool is not wrong.

It is simply operating under a model that lacks a teardown step for published test truth.

## 4. Narrow Product / Ops Goal

Do not redesign lifecycle globally.

Do not introduce a broad archive platform.

Do not add generic unpublish for every entity in the system.

The narrow goal is:

- give the admin a safe teardown path for test-marked published graphs;
- keep ordinary published truth strongly protected;
- keep the tool practical and operational, not platform-heavy.

This remains:

- admin-only internal tooling;
- centered on `Page`, `MediaAsset`, `Service`, and `Case` only where they are part of a test graph;
- separate from landing workspace composition UX;
- compatible with current publish and owner-truth boundaries.

## 5. Core Position

The next step should **not** be "make delete less strict".

The next step should be:

- keep delete strict;
- add a separate `test graph teardown` path.

This is important because delete and teardown are not the same thing.

### Delete

Delete asks:

- can this object disappear right now without damaging live truth?

### Test graph teardown

Teardown asks:

- is this published graph explicitly test-only?
- can the system deactivate its published truth safely?
- can it then remove the graph in a controlled order?

That is a different operation and deserves a different contract.

## 6. Proposed Narrow Solution

### 6.1 Add one explicit test-graph concept

Do not create a broad bundle domain.

Use the smallest machine-readable concept that is enough for teardown eligibility:

- entities may already carry `creationOrigin = "agent_test"`;
- add a test-graph-aware teardown evaluation that works across linked entities;
- optionally add a narrow page-level marker such as `creationOrigin = "agent_test"` for pages created through explicit test flows.

The important part is not naming. The important part is that the system can determine:

- this object is test-marked;
- its incoming and outgoing links are also test-marked or teardown-safe;
- it belongs to a graph that may be dismantled.

### 6.2 Define a special teardown flow

The flow should be separate from ordinary delete.

Suggested operator intent:

- `Удалить тестовый граф`
- or `Разобрать тестовую публикацию`

The flow should:

1. start from a selected test-marked root object;
2. discover linked first-slice objects and page anchors;
3. classify them as:
   - test-only and teardown-safe;
   - mixed / unsafe;
   - outside scope;
4. refuse if the graph is mixed with non-test live truth;
5. if safe, perform bounded deactivation + deletion in order.

## 7. Minimal Teardown Rules

The first slice should stay conservative.

### A graph may enter teardown only if

- the chosen root object is test-marked;
- every in-scope published dependency targeted for teardown is also test-marked;
- there are no incoming references from non-test published truth;
- there are no incoming references from non-test draft truth that should survive;
- no entity in the graph is required as active route-owning truth for a non-test live contour.

### Teardown must be denied if

- any non-test published object points into the graph;
- any non-test draft object points into the graph and would break if the graph disappeared;
- the graph contains a route-owning page or entity that is not test-marked;
- the graph cannot be reduced without leaving broken published references behind.

The refusal must be explicit.

## 8. What Teardown Must Actually Do

A bounded teardown operation should happen in two stages.

### Stage T1 — Deactivate published truth for the test graph

This is the missing capability today.

For test-marked entities only, and only inside a teardown-safe graph, the system needs a narrow ability to:

- clear active published truth;
- or move the entity out of live published participation;
- without pretending this is ordinary editorial unpublish.

This should be framed as:

- internal test teardown,
- not normal product lifecycle.

### Stage T2 — Delete the now-inactive test graph

Once published truth has been deactivated safely, the existing delete machinery can remove entities in dependency-aware order.

A practical order would usually be:

1. `Page`
2. `Case`
3. `Service`
4. `MediaAsset`

But the implementation should derive the actual order from references rather than hardcoding business assumptions everywhere.

## 9. First-Slice Scope

### Include in teardown evaluation

- `Page`
- `MediaAsset`
- `Service`
- `Case`

### Include in first teardown execution

- test-marked `Page`
- test-marked `Service`
- test-marked `Case`
- test-marked `MediaAsset`

### Exclude for now

- general-purpose unpublish for ordinary editorial objects;
- galleries unless they are proven necessary in the first real teardown cases;
- non-test published objects of any type;
- shell/global settings/system entities.

## 10. UI Surface Recommendation

Keep the UI small.

Do not add this into landing workspace.

Add it only to admin operational surfaces.

### Minimum UI

1. filter `Только тестовые`
2. entity/page marker `Тестовый`
3. one explicit action:
   - `Удалить тестовый граф`
4. confirmation screen with:
   - objects that will be removed;
   - objects that block teardown;
   - explicit refusal reasons if not allowed.

This can be reached from:

- entity detail for test-marked `service`, `case`, `media`;
- page detail for test-marked pages later, if the first slice proves it necessary.

## 11. What Is Explicitly Deferred

Do not build now:

- a broad archive-first lifecycle subsystem;
- generic unpublish for all entities;
- page-bundle domain modeling;
- background cleanup jobs;
- recommendation engine for likely test graphs;
- automatic graph inference from titles or names;
- generalized delete for `Page` outside the teardown flow.

## 12. Smallest Safe Implementation Step

The next narrow implementation slice should be:

1. extend test-marking to explicit test `Page` creation flows;
2. add a teardown evaluator that starts from a test-marked root and checks linked `Page/Service/Case/MediaAsset` objects;
3. add a bounded internal capability to deactivate published truth for teardown-safe test-marked entities;
4. reuse existing delete engine to remove the graph only after deactivation succeeds;
5. add one small admin UI entry point for `Удалить тестовый граф` with explicit refusal reasons.

This is the smallest step that actually addresses the current pain.

## 13. Critical Stance

### What the current delete tool got right

- machine-readable test marking is correct;
- safe-delete refusal is correct;
- refusing to delete published truth is correct.

### What it cannot solve by itself

- published test graph teardown;
- deactivation of active published truth;
- cleanup of linked published test objects.

### What should not happen next

- weakening delete rules just to make test cleanup easier;
- turning ordinary delete into hidden unpublish;
- introducing a giant lifecycle platform in response.

### What should happen next

- add a narrow, explicit teardown path for test-marked published graphs.

That is the real missing capability now.
