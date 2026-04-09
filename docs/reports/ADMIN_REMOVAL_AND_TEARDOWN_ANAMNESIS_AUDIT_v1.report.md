# ADMIN_REMOVAL_AND_TEARDOWN_ANAMNESIS_AUDIT_v1

## 1. Audit Scope

This audit checks the current reality of three already implemented mechanisms:

- ordinary safe delete;
- test-marked published graph teardown;
- ordinary live deactivation (`Вывести из живого контура`).

The goal is not to restate plans. The goal is to answer what is actually implemented, what is actually reachable in the deployed admin UI, and why the user's real test-data cleanup case still feels stuck.

This audit is based on:

- code inspection;
- prior execution and reality reports;
- deployed admin UI inspection through Playwright with a real authenticated session;
- live runtime state inspection for current `Page` / `Service` / `Case` data.

No fixes were implemented in this task.

## 2. Sources Checked

### Reports and plans

- [ADMIN_DELETE_TOOL_EXECUTION_v1.report.md](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/ADMIN_DELETE_TOOL_EXECUTION_v1.report.md)
- [ADMIN_DELETE_TOOL_REALITY_CHECK_v1.report.md](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/ADMIN_DELETE_TOOL_REALITY_CHECK_v1.report.md)
- [ADMIN_TEST_GRAPH_TEARDOWN_EXECUTION_v1.report.md](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/ADMIN_TEST_GRAPH_TEARDOWN_EXECUTION_v1.report.md)
- [ADMIN_TEST_GRAPH_TEARDOWN_REALITY_CHECK_v1.report.md](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/ADMIN_TEST_GRAPH_TEARDOWN_REALITY_CHECK_v1.report.md)
- [ADMIN_PAGE_AND_LIVE_ENTITY_REMOVAL_PLAN_v1.md](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/engineering/ADMIN_PAGE_AND_LIVE_ENTITY_REMOVAL_PLAN_v1.md)
- [ADMIN_LIVE_DEACTIVATION_EXECUTION_v1.report.md](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/ADMIN_LIVE_DEACTIVATION_EXECUTION_v1.report.md)
- [ADMIN_LIVE_DEACTIVATION_REALITY_CHECK_v1.report.md](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/ADMIN_LIVE_DEACTIVATION_REALITY_CHECK_v1.report.md)
- [ADMIN_LIVE_DEACTIVATION_PLAYWRIGHT_OPERATOR_SMOKE_v1.report.md](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/ADMIN_LIVE_DEACTIVATION_PLAYWRIGHT_OPERATOR_SMOKE_v1.report.md)

### Code paths inspected

- [EntityEditorForm.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/EntityEditorForm.js#L122)
- [entity-delete.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/entity-delete.js#L11)
- [entity-delete.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/entity-delete.js#L234)
- [live-deactivation.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/live-deactivation.js#L11)
- [live-deactivation.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/live-deactivation.js#L373)
- [test-graph-teardown.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/test-graph-teardown.js#L16)
- [test-graph-teardown.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/test-graph-teardown.js#L472)
- [page list create entry](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/entities/[entityType]/page.js#L30)
- [page new flow](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/entities/[entityType]/new/page.js#L64)
- [entity save route](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/api/admin/entities/[entityType]/save/route.js#L31)

### Runtime/UI evidence

- Authenticated Playwright inspection of deployed admin on `2026-04-09`
- Live service editor for `Pilot Service mnlslpw0`
- Live page list and page editor for current `Landing workspace test page` rows
- Live case list
- Live runtime aggregate scans for current `Page` / `Service` / `Case` cards

## 3. Expected Model vs Actual Implementation

### Expected model from reports and conversation

The intended operator mental model drifted toward this:

- ordinary delete handles obvious junk;
- test graph teardown cleans published linked test data;
- ordinary live deactivation removes ordinary live entities from public contour;
- therefore test pages/services/cases created by the agent and later published/reviewed should be removable through admin UI.

### Actual implementation boundary

The real implementation is narrower:

- ordinary delete covers only `media_asset`, `service`, and `case`, not `page` at all;
- test graph teardown works only when the root and all in-scope graph members are explicitly `creationOrigin = agent_test`;
- test graph teardown refuses graphs with `review` revisions;
- ordinary live deactivation works only for ordinary non-test entities with active published truth and no review/publish blockers;
- `Page` editor actions are shown only when those strict conditions are met.

The real user case falls between these mechanisms:

- current test `Page` rows are not test-marked;
- current test `Page` rows are not live;
- current `Pilot Service mnlslpw0` is live but not test-marked and still has review-state participation;
- current `Case` data is absent;
- therefore the implemented mechanisms do not line up with the concrete data shape the user is trying to clean.

## 4. Findings By Mechanism

### 4.1 Ordinary Delete

Verdict:

- `WORKING AS INTENDED` for declared scope
- `UI NOT WIRED` for `Page`

What is real:

- delete is implemented only for `media_asset`, `service`, and `case` in [entity-delete.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/entity-delete.js#L11);
- `Page` is not part of supported delete scope;
- editor action visibility also excludes `Page`, because `canDeleteEntity` is true only for `service` and `case` in [EntityEditorForm.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/EntityEditorForm.js#L122);
- refusal logic for published and review-state entities is real and operator-readable in [entity-delete.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/entity-delete.js#L238).

What was runtime-verified:

- `Service` editor for `Pilot Service mnlslpw0` shows `Удалить`;
- clicking `Удалить` produces the refusal:
  - `Сущность опубликована и участвует в живом контуре. Объект участвует в review/publish-потоке.`

What this means:

- ordinary delete is not broken;
- it is doing exactly what it was built to do;
- it does not solve the current stuck published-test-data case;
- it never covered `Page`, despite later expectations drifting in that direction.

### 4.2 Test-Marked Published Graph Teardown

Verdict:

- `NARROWER THAN REPORTED`
- `INCOMPLETE MARKER PROPAGATION`
- `CORRECTLY BLOCKED` on review-state graphs

What is real:

- the mechanism exists and supports `Page`, `Service`, `Case`, and `MediaAsset` in [test-graph-teardown.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/test-graph-teardown.js#L16);
- the root must be explicitly test-marked in [test-graph-teardown.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/test-graph-teardown.js#L472);
- every traversed in-scope member must also be test-marked in [test-graph-teardown.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/test-graph-teardown.js#L513);
- any member with a review revision blocks teardown in [test-graph-teardown.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/test-graph-teardown.js#L518).

What is missing in the real user case:

- the current live test pages and services the user cares about are not test-marked;
- live runtime scan showed current `Page` rows with `creationOrigin = null`;
- live runtime scan also showed `Pilot Service mnlslpw0` with `creationOrigin = null`;
- because of that, the teardown button is not shown for those objects and the evaluator would refuse them even before graph safety checks.

What this means:

- teardown covers an idealized explicit-test graph created after marker support existed and only through the exact marked flows;
- it does not cover older or differently created test data that is still functionally “test data” from the operator's point of view;
- it also refuses graphs that still carry review-state revisions, which is correct by current rules but makes the mechanism much less useful for the messy real test fixtures the agent created.

### 4.3 Ordinary Live Deactivation

Verdict:

- `WORKING AS INTENDED` in its narrow slice
- `CORRECTLY BLOCKED` on the tested `Service`
- `NARROWER THAN REPORTED` in practical operator coverage

What is real:

- live deactivation supports only `Page`, `Service`, and `Case` in [live-deactivation.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/live-deactivation.js#L11);
- it explicitly refuses test-marked roots and points them toward teardown in [live-deactivation.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/live-deactivation.js#L373);
- it refuses entities with no active published truth in [live-deactivation.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/live-deactivation.js#L377);
- it refuses review-state entities in [live-deactivation.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/live-deactivation.js#L381).

What was runtime-verified:

- `Pilot Service mnlslpw0` shows a visible separate `Вывести из живого контура` action;
- dry-run is real and operator-readable;
- dry-run correctly shows route impact for `/services/pilot-service-mnlslpw0`, `404`, list impact, and revalidation;
- execution is refused because the entity still participates in review/publish.

What was not realized in practice:

- no allowed `Page` live-deactivation subject was available in current runtime data;
- no allowed `Service` live-deactivation subject was available either;
- `Case` had no data to test;
- therefore “Page, Service, Case are covered” is code-true but operationally only partially demonstrated.

## 5. Findings By Entity

### 5.1 Page

Verdict:

- `UI NOT WIRED` for ordinary delete
- `NARROWER THAN REPORTED` for live-deactivation usability
- `INCOMPLETE MARKER PROPAGATION` for teardown relevance

Why `Page` feels stuck in practice:

- ordinary delete is not implemented for `Page` at all;
- page editor does not show `Удалить` by design because [EntityEditorForm.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/EntityEditorForm.js#L122) excludes `Page`;
- live-deactivation is shown only when there is active published truth and the page is not test-marked, per [EntityEditorForm.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/EntityEditorForm.js#L124);
- test teardown is shown only when the page is explicitly test-marked, per [EntityEditorForm.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/EntityEditorForm.js#L131).

What runtime showed:

- current `Landing workspace test page` rows in live admin were draft/review, not live published;
- the tested page editor showed `Сущность ещё не опубликована.`;
- the editor showed neither `Удалить` nor `Вывести из живого контура`;
- live scan also showed these current pages with `creationOrigin = null`, so teardown would not appear either.

Answer to the specific question:

- `Page` does **not** currently have an actual usable UI path for removal/deactivation in the states the user cares about.
- This is not one single bug.
- It is a combination of:
  - no ordinary `Page` delete support at all;
  - live-deactivation visibility being correctly conditional on active live truth;
  - current page fixtures being non-live;
  - current page fixtures not being test-marked.

### 5.2 Service

Verdict:

- `WORKING AS INTENDED` for ordinary delete and live-deactivation refusal
- `CORRECTLY BLOCKED`
- `INCOMPLETE MARKER PROPAGATION` for teardown applicability

Why `Service` feels stuck:

- `Pilot Service mnlslpw0` is published and still tied to review/publish state;
- ordinary delete correctly refuses it;
- live-deactivation correctly refuses it;
- test teardown is not available because the service is not test-marked.

What runtime showed for `Pilot Service mnlslpw0`:

- `creationOrigin = null`
- active published truth exists
- a review-state revision still exists
- UI exposes both `Удалить` and `Вывести из живого контура`
- both flows refuse with operator-readable reasons

This is the clearest example of the real mismatch:

- the UI is wired;
- the safety logic is mostly doing what it was told to do;
- but the actual service fixture sits outside all three happy paths.

### 5.3 Case

Verdict:

- `NOT VERIFIED`

Why:

- current live admin data contains no `Case` entities;
- code supports ordinary delete and ordinary live deactivation for `Case`;
- test teardown also supports `Case`;
- but there was no runtime subject to confirm either success or blockage patterns.

### 5.4 MediaAsset

Verdict:

- `WORKING AS INTENDED` for the narrow delete model
- `NOT VERIFIED` in this audit's runtime UI

Why:

- the user explicitly asked not to touch media in this smoke;
- code still keeps media protected in ordinary delete when published or referenced;
- media only participates in teardown as a dependent pure-test graph member, not as part of ordinary live deactivation.

The current user pain is not that media is over-protected in isolation.
The pain is that page/service/case test fixtures feel stuck before the operator can even reach a coherent cleanup state around them.

## 6. What Is Working As Intended

- Ordinary delete for `Service` and `Case` is real and separate from other mechanisms.
- Ordinary delete refusal on published/review-state service is correct and operator-readable.
- Ordinary live deactivation is a real separate mechanism with a real dry-run page.
- Dry-run route/public-side consequences for `Service` are clearly surfaced.
- Test graph teardown exists as a separate mechanism and has real safety boundaries.
- The system is correctly protecting published truth from casual destructive actions.

## 7. What Is Blocked By Correct Safety Rules

- Deleting a published `Service` with active live truth.
- Deactivating a `Service` that still has a review-state revision.
- Running teardown on a graph member that is not test-marked.
- Running teardown on graph members that still have review-state revisions.
- Using ordinary live deactivation on test-marked roots instead of the dedicated teardown path.

These are mostly not bugs. They are guardrails working as coded.

## 8. What Is Blocked By Implementation / UI Gaps

- `Page` has no ordinary delete path in UI or backend scope.
- Current real test pages are not test-marked, so teardown entry points are absent.
- Current real test pages are not live, so live-deactivation entry points are absent.
- The actual test fixtures created before or outside explicit marker flows do not fit the assumptions baked into teardown.
- `Case` coverage exists in code but has no runtime data proving it is usable.

This is the core implementation gap:

- the model assumes future cleanly marked test flows;
- the real operator pain comes from already-created messy test fixtures with null origin and review/publish residue.

## 9. What Prior Reports Overstated Or Left Ambiguous

### `ADMIN_TEST_GRAPH_TEARDOWN_REALITY_CHECK_v1`

Overstated:

- it said the slice was honest enough for operator testing and described pure graph teardown as effectively ready.

What was left ambiguous:

- that the real live test data the user was trying to remove was not actually test-marked;
- that review-state graphs are categorically refused;
- that this makes the mechanism much narrower in practice than the conversation around “remove test page/service/case graph” implied.

### `ADMIN_LIVE_DEACTIVATION_REALITY_CHECK_v1`

Overstated:

- it said `Page`, `Service`, and `Case` are covered.

What was left ambiguous:

- that `Page` coverage is conditional on active published truth and does not imply any ordinary `Page` delete path;
- that current runtime pages did not satisfy those conditions;
- that the operator looking at current page editors would see no removal action at all.

### `ADMIN_DELETE_TOOL_*`

Mostly accurate:

- these reports correctly said `Page` delete was out of scope.

What later drifted:

- later expectations in conversation started treating `Page` cleanup as if it should already exist in the same UI sense as `Service` and `Case`, which the original delete slice never promised.

## 10. Overall Diagnosis

The actual problem is not one broken button.

It is a four-part collision:

1. real test fixtures were created in a way that left `creationOrigin = null`;
2. some of those fixtures entered published/review-like states;
3. ordinary delete correctly refuses them;
4. teardown and live-deactivation both assume cleaner state than those fixtures actually have.

In short:

- ordinary delete is real;
- live-deactivation is real;
- teardown is real;
- but the real user-owned test fixtures often sit outside the valid operating envelope of all three.

That is why the user experience is “I still cannot remove this through UI,” even though multiple mechanisms were reported as implemented.

## 11. Smallest Corrective Next Step

The smallest corrective next step is:

- add one explicit admin UI path to manually classify a confirmed `Page` / `Service` / `Case` as test data before teardown, or otherwise normalize legacy test fixtures into the teardown path.

Why this is smaller than a new lifecycle round:

- it targets the concrete mismatch between current messy fixtures and the already-implemented teardown mechanism;
- it does not weaken ordinary delete;
- it does not weaken live-deactivation;
- it does not require a general platform answer first.

Without that bridge, the current implementation remains narrower than the real operational expectation for agent-created test data.
