# ADMIN_DELETE_TOOL_REDESIGN_PLAN_v1

## 1. Why The Previous Proposal Is Too Broad

The earlier cleanup proposal correctly identified the real problem: agent-created test data pollutes the small admin environment and creates noise in `media`, `service`, and `case` surfaces.

But for the current phase it overreaches in three ways:

- it starts to look like a lifecycle platform instead of a practical operator tool;
- it assumes archive-first should become the default answer everywhere;
- it adds filters, grouping, and bundle-like cleanup ideas before the core delete path exists.

That is too much for the current system size.

The current admin is still a small write-side operations console:

- `service` and `case` already use narrow draft/save surfaces;
- `media` already has a limited archive/restore path;
- the main operational gap is not "lack of lifecycle sophistication";
- the main gap is "there is no fast, explicit, machine-grounded way to remove test junk or refuse unsafe deletion".

This plan reduces the scope to that gap only.

## 2. Narrowed Product / Ops Goal

The goal is not to build a cleanup subsystem.

The goal is to provide two bounded delete paths:

1. a fast cleanup path for agent-created test data;
2. a human UI delete path for ordinary entities, with explicit refusal reasons when delete is unsafe.

This remains:

- admin-only operational tooling;
- centered on `media`, `service`, and `case`;
- outside landing workspace composition behavior;
- compatible with current publish and owner-truth boundaries.

## 3. Dual-Delete Model

### Path A — Agent Test-Data Delete

This path exists for data created through explicit agent/test flows.

Requirements:

- persisted machine-readable test marker at creation time;
- filterable in admin lists;
- bulk-select and bulk-delete affordance;
- low-friction delete when the object satisfies safe-delete rules;
- explicit refusal when it does not.

This path is optimized for "clean up the mess created by automated or semi-automated test runs".

### Path B — Human Delete For Ordinary Entities

This path exists for any operator who wants to remove an entity manually.

Requirements:

- entity-level `Удалить` action in the editor or detail surface;
- no reliance on hidden context or remembered naming convention;
- same safe-delete rule engine as Path A;
- explicit refusal reasons if delete is denied.

This path is optimized for "I want to remove this entity and the system must tell me yes or no honestly".

## 4. Minimal Marker Strategy For Agent-Created Test Data

### Recommended marker

Use one narrow persisted origin field:

- `creationOrigin = "agent_test"`

Why this is the best minimal option:

- it is clearer than a boolean like `isTestData` because it records why the marker exists;
- it avoids overloading general editorial meaning into a vague "test" flag;
- it leaves room for future machine-created origins without redesigning the field;
- it does not require naming conventions or chat memory.

### Scope of auto-marking

Auto-marking should happen only for explicit test/sandbox agent flows.

It should not silently tag normal editorial saves.

Narrow rule:

- if the object is created through an explicit agent/API testing path, set `creationOrigin = "agent_test"`;
- otherwise leave the field empty or default-origin.

This is enough for Step A.

Do not build:

- a broad provenance system;
- multi-origin analytics;
- fuzzy heuristics based on titles or prompt text.

## 5. First-Slice Entity Scope

### Include now

- `MediaAsset`
- `Service`
- `Case`

Reason:

- they are the current pollution sources;
- they already have clear editor/list surfaces;
- they already function as reusable inputs in landing work;
- they can be evaluated against concrete reference/publish rules.

### Exclude from first delete slice

- `Page`

Reason:

- `Page` is more entangled with page ownership, landing workspace anchoring, and publishable composition truth;
- hard-delete on `Page` has a much higher chance of crossing route-ownership or publish-boundary rules;
- the current problem can be materially improved without adding `Page` deletion in Step A.

`Page` may appear later as a contextual dependency in refusal messages, but it should not be a first-slice delete target.

## 6. Minimum Safe-Delete Rules

Delete must be denied when any of the following is true.

### Universal deny conditions for first slice

- the entity has an active published revision;
- the entity is referenced by any published object;
- the entity is referenced by any non-test draft object;
- the entity is involved in an active review/submit/publish path that should remain inspectable;
- deleting it would break current route-owning truth or page composition truth.

### Entity-specific practical rules

#### `MediaAsset`

Delete allowed only if:

- not published as active truth;
- not used by published `Page`, `Service`, `Case`, or `Gallery`;
- not used by non-test draft entities.

Otherwise:

- refuse with explicit reasons such as:
  - "Используется в опубликованной странице"
  - "Входит в галерею"
  - "Используется в рабочем черновике услуги"

#### `Service`

Delete allowed only if:

- no active published revision;
- not referenced by published `Case` or `Page` composition;
- not referenced by non-test draft entities;
- not route-live as active truth.

Otherwise refuse explicitly.

#### `Case`

Delete allowed only if:

- no active published revision;
- not referenced by published `Service` or `Page` composition;
- not referenced by non-test draft entities;
- not route-live as active truth.

Otherwise refuse explicitly.

### What "safe" means in this phase

Safe does not mean "probably fine".

Safe means:

- machine-checkable;
- reference-aware;
- explainable to the operator;
- conservative when data is live or reused.

## 7. UI Surface Recommendations

This plan keeps the UI very small.

### For test-data cleanup

Add only:

- filter `Только тестовые`;
- multi-select in relevant list views;
- bulk action `Удалить тестовые`;
- result summary:
  - deleted count
  - refused count
  - explicit refusal reasons per entity when needed

This belongs in the existing list/workspace surfaces for:

- `media`
- `service`
- `case`

### For ordinary human deletion

Add only:

- entity-level `Удалить` action in the editor/detail surface;
- confirmation step;
- refusal message area when delete is denied.

Do not make delete depend on hidden menus or implicit card clicks.

The operator should be able to see:

- the action;
- the decision;
- the reason.

### Refusal message quality

Refusal must not say only "unsafe".

It must name the blocking reason in operator language, for example:

- "Сущность опубликована и участвует в живом контуре."
- "На объект ссылается опубликованный кейс."
- "Объект используется в рабочем черновике страницы."

## 8. Does Archive-First Belong In Step A?

### Decision

No. Archive-first should be deferred for `service` and `case`.

### Why

- the immediate problem is deletion of test junk, not long-term editorial shelving;
- `media` already has a limited archive path and does not need to be generalized right now;
- broad archive-first would force lifecycle UX, filters, and state semantics before the delete path is solved;
- current system smallness and human review are enough guardrails for a narrower Step A.

### What to do instead

Step A should use:

- direct safe delete;
- explicit refusal if delete is not allowed.

Archive may remain where it already exists for `media`, but it should not become the main design center of this plan.

## 9. What Auto-Marking Should Do

Auto-marking should be narrow and boring.

It should:

- mark entities created through explicit agent test flows;
- make those entities easy to filter;
- support bulk cleanup.

It should not:

- infer test-ness from titles;
- infer test-ness from chat history;
- mark normal operator-created drafts automatically;
- create a larger provenance model.

## 10. What Is Explicitly Deferred

Deferred from this plan:

- broad archive/lifecycle platform for all entities;
- grouped cleanup by page bundle;
- page hard-delete first slice;
- complex provenance taxonomy;
- recommendation engine for what to delete;
- cross-domain cleanup wizard;
- workspace-integrated delete inside landing composer;
- automatic cleanup jobs;
- naming-convention heuristics.

## 11. Smallest Safe Implementation Step

The first implementation slice should be:

1. add persisted `creationOrigin = "agent_test"` support for explicit agent-created test entities;
2. add `Только тестовые` filter to `media`, `service`, and `case` lists;
3. add bulk delete for test-marked entities;
4. add entity-level delete action for `media`, `service`, and `case`;
5. implement a narrow safe-delete rule engine with explicit refusal reasons;
6. exclude `Page` from delete targets in this slice.

This is the smallest step that solves the real problem without creating a platform.

## 12. Critical Stance

What the broader proposal got right:

- machine-readable marking is non-negotiable;
- delete must be reference-aware;
- test data pollution is a real operational issue.

What it overbuilt:

- archive-first as a general answer;
- grouped bundle cleanup;
- too much lifecycle structure for a small current system.

What is actually needed now:

- explicit marker;
- explicit delete action;
- explicit refusal reasons;
- bulk cleanup for test-marked objects.

That is enough for the current phase.
