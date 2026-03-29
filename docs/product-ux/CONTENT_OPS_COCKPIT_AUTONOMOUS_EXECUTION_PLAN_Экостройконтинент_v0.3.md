# CONTENT OPS COCKPIT Autonomous Execution Plan for Экостройконтинент v0.3

Дата: 2026-03-29  
Тип: `playbook` / `autonomous execution` / `stage-bounded implementation plan` / `UI hardening revision`  
Назначение: жёсткий план исполнения для следующего автономного эпика admin content-ops cockpit

Этот документ намеренно жёстче, чем v0.2.  
v0.2 уже отвечал на вопрос "как агент строит это по стадиям, без дрейфа, с проверяемым результатом".  
v0.3 дополнительно отвечает на вопрос "как заставить интерфейс вести оператора, а не показывать схему".

## 1. Execution chain

Одна линейка исполнения. Стартовать следующий stage можно только после того, как текущий stage дал свой proof package и прошёл проверку на отсутствие drift.

| Stage | Primary PR boundary | Goal | Gate to next stage |
| --- | --- | --- | --- |
| Stage 1 | PR1 | Shared cockpit projections and field-anchor contract | DTO tests green, anchor map frozen, no UI changes |
| Stage 2 | PR2 | `/admin` cockpit surface and launch-core coverage panel | Dashboard renders new panels, links work, empty states defined |
| Stage 3 | PR3 | Actionable readiness UX and explicit SEO / truth sections | Blockers jump to exact anchors on the required entity types |
| Stage 4 | PR4 | Evidence register surface | Evidence is visible as projection only, no new truth store |
| Stage 5 | PR5 | Relation UX improvements | Chips / quick-open / summary work without graph overengineering |
| Stage 6 | PR6 | List-level visibility and hardening | List badges are truthful, build and tests pass, no regression on core flows |

Hard rule: one stage equals one PR unless the stage hits a stop trigger.  
Do not start Stage 3 before Stage 2 is proven.  
Do not mix Stage 4/5/6 work into earlier PRs "for convenience".

## 2. Anti-drift constitution

The following are not negotiable. If any implementation path would violate one of these, stop and escalate instead of silently widening scope.

- No new entities beyond the current first slice: `global_settings`, `media_asset`, `gallery`, `service`, `case`, `page`.
- No new persisted evidence store.
- No new canonical readiness semantics.
- No workflow engine rewrite.
- No page builder.
- No visual composition system.
- No new relation model or relation graph.
- No expanded later-slice content types just to make the cockpit look richer.
- No broad analytics dashboard.
- No public-site redesign.
- No media truth model replacement.
- No admin shell rewrite.
- No hidden backend business logic duplicated in the frontend.

If a task needs any of the above, it is not a subtask. It is a stop trigger.

## 4. Operator-first UX framing

This plan treats the admin frontend as a working place for a SEO/content operator.

The operator does not think in readiness codes or schema terms. The operator thinks in terms of:

- what exists already;
- what is missing;
- why it is missing;
- what to do next;
- where the proof is;
- where to click to fix it;
- how to keep context while moving.

Required UI grammar:

- The main cockpit must answer `what should I do next?` first.
- Every entity screen must show state, problems and next step before the form.
- Every blocker must either jump to a concrete field or land on a clearly labelled fallback section.
- Every relation summary must preserve context and expose a quick-open action.
- Every evidence surface must read like proof status, not like an abstract file store.
- Every list row must help prioritisation before the detail page opens.
- Empty and partial states must be honest: no fabricated green state, no implied completeness.

Owner decision boundaries for UI grammar:

- The agent may choose spacing, copy brevity and component composition if meaning stays the same.
- The agent must stop and ask for owner review if a change alters what a section means, what evidence means, or how a relation summary should be interpreted.
- The agent must stop and ask for owner review if cockpit wording would imply a new canonical state.
- The agent must stop and ask for owner review if empty-state wording would hide missing data.

Anti-dashboard-theater rule:

- Informational surfaces are allowed only if every signal either links to a fix or honestly says that no fix can be offered yet.
- No decorative KPI wall.
- No page-builder drift.

UI regression guard:

- If a new UI path adds a mandatory click or route hop to an existing operator task, the stage fails unless the new path removes at least one other required step or the owner has explicitly approved the trade-off.
- If the new UI makes a core task harder to complete, the stage fails even if the surface looks cleaner.
- If a fallback adds friction, it must be labelled and justified, not hidden.

## 5. Proof package contract

Every stage must end with a proof package. The proof package is required in the stage handoff and should also be summarized in the PR description.

Minimum contents:

- Changed files list.
- Touched routes / components list.
- Screenshot set for the changed surfaces.
- Manual scenarios executed and their outcome.
- Automated tests added or updated.
- Build result.
- Short stage report: done, not done, blocked, follow-up.

Proof package rules:

- If the stage changes only helpers or DTOs, screenshots may be `N/A`, but the handoff must say so explicitly.
- If the stage changes UI, screenshots are mandatory.
- If the stage changes routes, the exact routes must be listed.
- If the stage uses fallback behavior, the fallback must be shown in the proof package.
- If a stop trigger was hit, the proof package must state it plainly.
- If a stage fails acceptance, the stage must not advance.

Failure flow:

1. Run the stage acceptance checks.
2. If any binary check fails, stop advancing.
3. If the fix stays inside the current PR boundary, repair it and rerun the same checks.
4. If the fix would need new canon, new semantics or scope drift, record the failure reason and raise a stop trigger.
5. The final stage report must say what failed, what was repaired and what remains blocked.

Recommended proof package template:

1. `Changed files`
2. `Routes checked`
3. `Screenshots`
4. `Manual flows`
5. `Tests`
6. `Build`
7. `Notes / stop triggers`
8. `Owner questions`

## 6. Locked baseline

This plan assumes the following current runtime truth and does not ask the agent to rebuild it:

- `components/admin/AdminShell.js` is the shell grammar.
- `components/admin/EntityEditorForm.js` is the main entity editor.
- `components/admin/ReadinessPanel.js` is the readiness surface.
- `components/admin/MediaGalleryWorkspace.js` is the strong media workspace.
- `components/admin/MediaCollectionOverlay.js` is the collection editing layer.
- `components/admin/MediaImageEditorPanel.js` is the image editing utility.
- `app/admin/(console)/page.js` is the main dashboard entry.
- `app/admin/(console)/review/[revisionId]/page.js` is the review detail page.
- `app/admin/(console)/revisions/[revisionId]/publish/page.js` is the publish gate.
- `app/admin/(console)/entities/[entityType]/page.js` is the list surface.
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js` is the detail editor.
- `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js` is the history and rollback loop.
- `lib/content-ops/readiness.js` is the canonical readiness engine.
- `lib/content-ops/workflow.js` is the canonical workflow engine.
- `lib/content-core/schemas.js` is the canonical entity shape.
- `lib/read-side/public-content.js` is the published read-side projection.

Do not re-implement these layers when a projection or UI composition is enough.

## 7. Stage-by-stage plan

The stage order is fixed. Each stage is one PR boundary and one proof package.

### 7.1 Stage 1 - Shared cockpit projections and field-anchor contract

### Stage ID / name

Stage 1: Shared cockpit projections and field-anchor contract

### goal

Create a small shared projection layer that turns existing canonical truth into cockpit-ready DTOs and stable anchor targets.

### PR boundary

PR1 only. No route pages. No cockpit UI. No editor surface changes.

### in-scope

- New projection helpers for cockpit / coverage / evidence / list badges.
- Field-anchor map for blocker jump links.
- Tests for DTO truth and anchor resolution.

### out-of-scope

- Any visible UI.
- Any new persisted state.
- Any canonical schema change.
- Any relation semantics change.

### owned routes/components/files

| Category | Details |
| --- | --- |
| Routes | none |
| Components | none |
| Shared helpers | `lib/admin/content-ops-cockpit.js`, `lib/admin/editor-anchors.js` or repo-local equivalents |
| Tests | `tests/admin/*` or the repo's existing test location |
| Forbidden zones | visible UI, persisted state, schema changes, relation semantics |

### required UI minimum

None. This stage is helper-only and must not create visible UI.

### empty / partial / fallback states

- If an anchor cannot be mapped, the helper must emit an explicit fallback marker.
- If the projection is partial, the helper must preserve the partial state.
- If no data exists for a first-slice entity, the helper must emit a truthful empty projection.

### must / should / optional

Must:

- derive cockpit-ready counts from current canonical truth.
- map readiness `field` values to stable anchor targets.
- keep the projection layer read-only.
- preserve missing-data state instead of hiding it.

Should:

- expose a single helper shape that later stages can reuse for cockpit, evidence and list badges.
- keep entity-type-specific logic explicit, not buried in ad hoc component code.

Optional:

- helper copy labels for future UI reuse.

### dependencies

- Canonical readiness data from `lib/content-ops/readiness.js`.
- Entity shape from `lib/content-core/schemas.js`.
- Existing admin truth helpers if they already exist in the repo.

### acceptance criteria (binary)

- DTO helpers return stable, deterministic shapes for the first-slice entities.
- Anchor map resolves the known readiness fields for `service`, `case`, `page`, and `global_settings`.
- Tests cover at least one happy path and one missing-anchor fallback path.
- No UI route was changed.
- No helper path reports partial data as healthy.

### proof package

- File list of new helpers and tests.
- Test output.
- A compact sample of helper output in the handoff.
- Explicit statement that no visible UI was changed.
- Explicit note of any fallback anchor markers used.

### failure flow

- If the anchor map cannot be made deterministic, stop and escalate.
- If the helper needs new canonical fields, do not patch around it.
- If partial data would be normalised away, repair the helper before moving on.

### stop triggers

- A helper would need new canonical fields.
- Anchor mapping cannot be derived from current readiness semantics.
- The stage starts inventing a new evidence schema.

### owner-review boundary

Owner review is required only if the projection cannot be expressed from existing canonical readiness and entity schema truth.

### 7.2 Stage 2 - Cockpit surface and launch-core coverage panel

### Stage ID / name

Stage 2: Cockpit surface and launch-core coverage panel

### goal

Turn `/admin` into a real operator cockpit that shows next actions, coverage and visible gaps in one place.

### PR boundary

PR2 only. No editor mutations. No evidence drawer. No relation UX changes.

### in-scope

- Cockpit card or block on `/admin`.
- Launch-core coverage panel.
- Next-action summary.
- Gap counters and visible empty states.

### out-of-scope

- Any editor layout changes.
- Any review/publish flow changes.
- Any new analytics charts.
- Any new canonical definitions for coverage.

### owned routes/components/files

| Category | Details |
| --- | --- |
| Routes | `app/admin/(console)/page.js` |
| Components | `components/admin/ContentOpsCockpitPanel.js`, `components/admin/LaunchCoreCoveragePanel.js`, `components/admin/CockpitNextActions.js` or repo-local equivalents |
| Shared helpers | Stage 1 cockpit DTOs and field-anchor helpers |
| Forbidden zones | editor layout changes, review/publish changes, analytics dashboards, new canonical coverage definitions |

### required UI minimum

- `/admin` must show three visible blocks in the cockpit:
  - `state`
  - `what to do`
  - `coverage`
- `/admin` must show a cockpit block above or alongside the current queue.
- The `state` block must show:
  - what is ready,
  - what is blocked,
  - what is missing,
  - what needs proof/evidence.
- The `what to do` block must show the next best action first.
- The `coverage` block must show the first-slice launch-core set.
- Coverage must include one visible row or tile for each first-slice launch-core type:
  - `global_settings`
  - `service`
  - `case`
  - `page`
  - `media_asset`
  - `gallery`
- Each row or tile must have one clear action target.
- The cockpit must never look healthy when coverage is empty.
- No chart theater. No KPI wall.

### empty / partial / fallback states

- If coverage data is empty, the cockpit must say that coverage has not been established yet.
- If only some entity types are covered, the panel must show partial coverage explicitly.
- If proof data is missing, the cockpit must mark the missing proof state instead of collapsing it into ready.
- If a linked action target is unavailable, the panel must fall back to the nearest valid list or detail route and label that fallback.

### must / should / optional

Must:

- show launch-core coverage without forcing the operator into multiple detail pages.
- link every important row to a concrete action target.
- keep the cockpit copy operator-facing, not architectural.
- make empty coverage states honest.

Should:

- show counts for ready / blocked / needs proof where the data exists.
- surface the most urgent next action first.

Optional:

- compact urgency badges.
- simple sort order by missing proof or blockers.

### dependencies

- Stage 1 projection helpers.
- Existing `/admin` shell and dashboard route.

### acceptance criteria (binary)

- A user on `/admin` can answer what is ready, blocked, missing and next without opening another route.
- The cockpit renders distinct `state`, `what to do` and `coverage` blocks.
- The coverage panel includes a row or tile for every first-slice launch-core type.
- Every row or tile links to a real route or editor target.
- Empty states are explicit and truthful.
- No state that lacks coverage is rendered as healthy.

### proof package

- Screenshot of `/admin` with the cockpit visible.
- Route list showing the linked targets.
- Manual click-through to at least one action target.
- Test or smoke check for the dashboard route.

### failure flow

- If a row cannot link to a real action target, stop and repair the mapping.
- If empty coverage is rendered as healthy, do not advance.
- If the cockpit starts behaving like a generic dashboard, stop and re-scope the UI grammar.

### stop triggers

- The cockpit starts asking for broad analytics or new KPIs.
- The launch-core set is no longer the first slice and needs owner confirmation.
- The panel becomes a generic dashboard rather than an operator cockpit.

### owner-review boundary

Owner review is required if the launch-core coverage vocabulary changes or if the cockpit wants to introduce new persistent state.

### 7.3 Stage 3 - Readiness actionability and explicit SEO / truth sections

### Stage ID / name

Stage 3: Readiness actionability and explicit SEO / truth sections

### goal

Make blockers actionable and make SEO / truth visible as a first-class operator layer inside the editor flows.

### PR boundary

PR3 only. No dashboard redesign. No evidence drawer. No relation summary overhaul.

### in-scope

- `service`, `case`, `page`, `global_settings` editor UX.
- Ready-to-fix blocker jump links.
- Explicit `SEO / truth` section grouping in the editor.
- Publish / review surfaces that share the same anchor behavior.

### out-of-scope

- New route-owning content types.
- Page builder features.
- Broad form redesign.
- Hidden business rules inside the frontend.

### owned routes/components/files

| Category | Details |
| --- | --- |
| Routes | `app/admin/(console)/review/[revisionId]/page.js`, `app/admin/(console)/revisions/[revisionId]/publish/page.js` |
| Components | `components/admin/EntityEditorForm.js`, `components/admin/ReadinessPanel.js` |
| Shared helpers | Stage 1 anchor helper, Stage 2 cockpit signal vocabulary, existing schema truth |
| Forbidden zones | new readiness logic, hidden SEO tail, generic form redesign, changing canonical truth fields |

### required UI minimum

- The editor screen must show a top block with state, problems and next step before the form takes over.
- The editor must expose a clear `SEO / truth` area for:
  - `global_settings`
  - `service`
  - `case`
  - `page`
- The visible truth fields must reflect current schema truth:
  - `global_settings`: `publicBrandName`, `legalName`, `primaryPhone`, `activeMessengers`, `publicEmail`, `serviceArea`, `primaryRegion`, `defaultCtaLabel`, `defaultCtaDescription`, `contactTruthConfirmed`
  - `service`: `slug`, `title`, `h1`, `summary`, `serviceScope`, `problemsSolved`, `methods`, `ctaVariant`, `relatedCaseIds`, `galleryIds`, `primaryMediaAssetId`
  - `case`: `slug`, `title`, `location`, `projectType`, `task`, `workScope`, `result`, `serviceIds`, `galleryIds`, `primaryMediaAssetId`
  - `page`: `slug`, `pageType`, `title`, `h1`, `intro`, `blocks`, `primaryMediaAssetId`
- Readiness blocker rows must jump to the exact field or section.
- If an exact anchor does not exist, the UI must fall back to a clearly labelled section anchor.
- The publish page must reuse the same blocker-to-anchor contract.
- The current form must not hide truth behind a generic tail of controls.

### empty / partial / fallback states

- If a truth field is missing, the UI must show it as missing, not blank and not healthy.
- If an exact anchor is unavailable, the fallback must be labelled as a fallback anchor.
- If only partial truth exists, the top summary must say that the entity is partial.
- If no blocker can be mapped, the panel must say so instead of inventing a destination.

### must / should / optional

Must:

- blockers are clickable.
- the click lands on the right field or section.
- the SEO / truth layer is visible, not buried in a generic tail of inputs.
- no duplicate readiness logic is introduced.
- partial data is not misrepresented as complete.

Should:

- the editor surface shows a compact top summary with blocker count and first next step.
- section labels explain why the operator is looking at the section.

Optional:

- sticky section summary while scrolling.
- small helper copy for the most important truth fields.

### dependencies

- Stage 1 field-anchor contract.
- Stage 2 cockpit phrasing if the editor references cockpit actions.

### acceptance criteria (binary)

- `service`, `case`, `page`, and `global_settings` all show explicit truth sections.
- Clicking a blocker in readiness goes to the correct field or labelled fallback section.
- Publish / review pages use the same navigation behavior.
- Contact-truth dependencies remain visible for the contact page flow.
- The entity screen header shows state, problems and next step before the form.

### proof package

- Screenshots of at least one editor per required entity type.
- Manual click proof for blocker jump links.
- Test coverage for anchor mapping and blocker navigation.
- Explicit note of any fallback behavior used.

### failure flow

- If a blocker cannot be mapped to a trustworthy destination, stop and escalate.
- If the truth layer is still hidden behind generic inputs, repair the layout before advancing.
- If a field grouping change would alter canonical semantics, pause for owner review.

### stop triggers

- A blocker cannot be mapped to a trustworthy destination.
- A field grouping change would alter canonical semantics.
- The work starts introducing new readiness logic instead of projecting canonical truth.

### owner-review boundary

Owner review is required if the field grouping or section naming changes canon, or if the team wants to reinterpret the SEO / truth surface beyond current schema truth.

### 7.4 Stage 4 - Evidence register surface

### Stage ID / name

Stage 4: Evidence register surface

### goal

Expose proof / evidence as a visible operator surface instead of forcing the user to infer it from scattered editor fields.

### PR boundary

PR4 only. No relation redesign. No list badges yet. No dashboard re-architecture.

### in-scope

- Evidence register drawer or panel.
- Integration points from cockpit and editor surfaces.
- Visible proof gap summary derived from current canonical truth.

### out-of-scope

- New persisted evidence model.
- Manual "mark evidence complete" actions.
- New review workflow.
- Any new truth source.

### owned routes/components/files

| Category | Details |
| --- | --- |
| Routes | `app/admin/(console)/page.js`, `app/admin/(console)/review/[revisionId]/page.js` or the smallest editor trigger route |
| Components | `components/admin/EvidenceRegisterPanel.js` or `components/admin/EvidenceRegisterDrawer.js` |
| Shared helpers | Stage 1 projection helpers, Stage 3 blocker logic, readiness data from `lib/content-ops/readiness.js` |
| Forbidden zones | persisted evidence store, editable evidence controls, new truth source, new review workflow |

### required UI minimum

- The evidence surface must be reachable from the cockpit and from at least one editor entry point.
- It must show proof state as a projection over existing data.
- The evidence surface must render at least one row as `entity + reason`.
- The evidence surface must include at least one actionable transition to a source entity or field.
- It must expose:
  - missing proof path,
  - invalid or unpublished references,
  - missing or unpublished primary media,
  - open publish obligations,
  - contact truth gaps where relevant.
- The surface must not pretend to be editable evidence storage.

### empty / partial / fallback states

- If no evidence gaps exist, the surface may show `no evidence gaps detected` only when the underlying projection has been computed.
- If evidence data is incomplete, the surface must say `evidence not fully available yet` or equivalent.
- If a route to a source entity is unavailable, the surface must show a labelled fallback target.
- A missing evidence calculation must never look like a healthy empty state.

### must / should / optional

Must:

- evidence is derived, not persisted.
- evidence rows show the source entity and the reason.
- the surface is usable from at least the cockpit and one editor entry point.
- no editable control is introduced.

Should:

- severity filtering.
- entity-type filtering.
- direct navigation to the source entity or field.

Optional:

- drawer mode if it keeps context better than a full page.

### dependencies

- Stage 1 projection helpers.
- Stage 3 blocker / anchor logic.
- Canonical readiness results from `lib/content-ops/readiness.js`.

### acceptance criteria (binary)

- A user can open evidence from the cockpit and from at least one editor.
- The panel shows proof gaps without requiring the user to inspect raw readiness output.
- The panel uses only canonical projections and never mutates truth.
- The panel exposes source entity and reason for every row.
- No edit action is present in the evidence surface.
- At least one row has an actionable transition.

### proof package

- Screenshot of the evidence surface.
- Manual flow showing open / inspect / close.
- Tests covering evidence projection.
- Clear statement that no persisted evidence store was added.

### failure flow

- If the surface needs a new evidence taxonomy, stop and escalate.
- If the implementation needs persisted evidence state, do not continue.
- If evidence starts competing with readiness instead of projecting it, repair the design first.

### stop triggers

- The surface starts requiring a new canonical evidence taxonomy.
- The implementation needs persisted evidence state.
- Evidence starts competing with readiness instead of projecting it.

### owner-review boundary

Owner review is required if evidence categories need a new canonical definition.

### 7.5 Stage 5 - Relation UX improvements

### Stage ID / name

Stage 5: Relation UX improvements

### goal

Make relationships feel navigable and context-preserving instead of checklist-only.

### PR boundary

PR5 only. No evidence-store work. No cockpit redesign. No list-level badges yet.

### in-scope

- Relation chips.
- Quick-open behavior.
- Relation summary and where-used cues.
- Better selected-state clarity in relation pickers.

### out-of-scope

- Graph editor.
- New relation semantics.
- New relation types.
- Multi-hop relationship explorer.
- Overly clever relation intelligence.

### owned routes/components/files

| Category | Details |
| --- | --- |
| Routes | editor and media routes already listed in the locked baseline |
| Components | `components/admin/FilterableChecklist.js`, `components/admin/MediaPicker.js`, `components/admin/MediaGalleryWorkspace.js`, `components/admin/MediaCollectionOverlay.js`, `components/admin/EntityEditorForm.js`, and optionally `components/admin/RelationChipRow.js` |
| Shared helpers | Stage 1 relation projections if they are reused |
| Forbidden zones | graph editor, new relation semantics, multi-hop explorer, overengineered relation intelligence |

### required UI minimum

- Selected relations must be summarised as clickable chips, not only as checkboxes.
- Each selected relation chip must expose a quick-open affordance.
- The user must be able to see what is currently linked without losing context.
- Removing a relation must be one obvious action.
- The checklist interaction may stay, but it must no longer be the only readable representation.
- The minimal relation scenario must support: open linked entity, return back, keep editing context.

### empty / partial / fallback states

- If nothing is linked, the screen must say `no relations yet` or equivalent and offer the next action.
- If only partial links exist, the summary must show that the relation set is partial.
- If quick-open cannot resolve a linked target, the chip must fall back to a labelled list/detail route.
- A relation list with no chips must not look complete.

### must / should / optional

Must:

- relation summary is visible.
- quick-open works.
- relation selection remains reversible and low-friction.
- no relation graph is introduced.
- context is preserved after opening a linked entity.

Should:

- relation chips include a short role label where the relation model already implies one.
- media and gallery surfaces expose where-used context when cheap to do so.

Optional:

- hover preview.
- open-in-new-tab action.

### dependencies

- Stage 1 helper layer.
- Stage 3 anchor helper.
- Current relation options from the entity editor / media workspace.

### acceptance criteria (binary)

- At least one linked entity can be opened from the relation surface without losing the editing context.
- The selected relation state is visible as a summary, not only as a checklist.
- Removing or adding a relation remains straightforward.
- The relation UX still works with the current first-slice relation model.
- Selected relations are rendered as clickable chips with quick-open action.
- The operator can open a linked entity and return without losing the originating context.

### proof package

- Screenshot of relation chips / summaries.
- Manual quick-open flow.
- Test coverage for selection summary and navigation.
- Notes on any fallback to checklist mode.

### failure flow

- If the work wants a graph editor, stop and re-scope.
- If the relation summary would change relation semantics, stop for owner review.
- If quick-open breaks context preservation, repair before advancing.

### stop triggers

- The work wants a graph editor.
- The work wants new relation semantics.
- The relation summary cannot be made truthful without new canonical data.

### owner-review boundary

Owner review is required if a new relation type, role or directionality is needed.

### 7.6 Stage 6 - List-level visibility and hardening

### Stage ID / name

Stage 6: List-level visibility and hardening

### goal

Make the operator see readiness and gaps earlier in list views, then close the epic with non-regression proof.

### PR boundary

PR6 only. This is the final stage. Do not add new product surfaces here.

### in-scope

- List badges.
- Gap markers.
- Readiness indicators on entity lists and relevant media lists/cards.
- Final tests and build hardening.

### out-of-scope

- New cockpit semantics.
- New relation semantics.
- New evidence categories.
- New product scope.

### owned routes/components/files

| Category | Details |
| --- | --- |
| Routes | `app/admin/(console)/entities/[entityType]/page.js` and any first-slice media list surfaces already in scope |
| Components | relevant list/card components used by that page, plus the smallest necessary part of `components/admin/MediaGalleryWorkspace.js` if media badges are shown |
| Shared helpers | Stage 1 list-badge projections, Stage 2 cockpit signal vocabulary, Stage 4 evidence projection if needed |
| Forbidden zones | new product scope, backend redesign, new readiness semantics, noisy visual clutter |

### required UI minimum

- List rows or cards must show a truthful readiness/gap signal before opening the detail page.
- The signal must be derived from canonical readiness or projection helpers.
- A blocked row must be visible at a glance.
- A proof-gap row must be visibly different from a ready row.
- Empty states must remain useful and honest.

### empty / partial / fallback states

- If list signal data is missing, the row must not look healthy.
- If only some signals are available, the row must show partial state rather than a green state.
- If the badge cannot be derived, the UI must fall back to a neutral `check detail` style message.
- A row with blocked state must never be rendered as ready.

### must / should / optional

Must:

- list-level signal exists for the first-slice entities.
- the signal is truthful and consistent with cockpit/readiness surfaces.
- build and tests pass.
- no blocked row is rendered as ready.

Should:

- sort or filter by readiness where this is already cheap and safe.
- show proof-gap markers where the data is already available.

Optional:

- saved filters if they do not require new backend work.

### dependencies

- Stage 1 projection helpers.
- Stage 2 cockpit signal vocabulary.
- Stage 3 readiness semantics.
- Stage 4 evidence projection if the list uses evidence markers.

### acceptance criteria (binary)

- A user can prioritise work from the list view without opening every detail page.
- Readiness signals match the cockpit and editor surfaces.
- No regression on review, publish, rollback or media flows.
- The final build and tests are green.
- Every first-slice list page shows a row-level readiness signal.

### proof package

- Screenshot of the key list pages with badges / markers.
- Manual list flow with one blocked and one ready entity.
- Final test and build output.
- Explicit no-regression statement for review / publish / media / history.

### failure flow

- If list badges require backend redesign, stop and escalate.
- If a blocked row can be mistaken for ready, repair before advancing.
- If the list becomes noisy instead of helpful, trim the signal set before shipping.

### stop triggers

- List badges require backend redesign.
- The visual signal becomes clutter or noise instead of operator help.
- The stage starts changing readiness semantics.

### owner-review boundary

Owner review is required if new list-level business signals are proposed.

## 11. Recommended execution order

Use the stage order as written. Do not reshuffle unless a stop trigger forces a re-plan.

1. Stage 1 first because every later surface needs truthful projections and anchors.
2. Stage 2 second because it validates the cockpit vocabulary early and gives immediate operator value.
3. Stage 3 third because it removes the most painful operator friction: blocker-to-field navigation and hidden SEO / truth.
4. Stage 4 fourth because evidence only becomes useful once cockpit and readiness are already visible.
5. Stage 5 fifth because relation UX depends on stable field anchors and operator language.
6. Stage 6 last because list badges should reflect the final cockpit semantics, not temporary intermediate ones.

Parallelisation rule:

- Stage 2 and Stage 3 may be split between separate workers only after Stage 1 is frozen.
- Stage 4 should wait until the stage 1 anchor contract and stage 3 readiness links are stable.
- Stage 6 stays last.

## 12. Acceptance ladder

This ladder is stricter than a generic product acceptance checklist. Every item is expected to be true by the end of the relevant stage and still true at the end of the epic.

### Stage-level acceptance

- Stage 1: helpers are truthful, deterministic and covered by tests.
- Stage 2: `/admin` shows cockpit and coverage without forcing multiple detail-page jumps.
- Stage 3: blockers jump to exact fields or sections on `service`, `case`, `page`, `global_settings`.
- Stage 4: evidence is visible as a projection only.
- Stage 5: relation UX is summarised as relations, not only as checkboxes.
- Stage 6: list rows show readiness / gap signals and the core workflows still work.

### Epic-level acceptance

- `/admin` answers ready / blocked / missing / next without leaving the entry point.
- Launch-core coverage shows one row or tile per first-slice entity type.
- A blocker click lands on a field or labelled fallback section.
- The evidence surface shows source entity and reason, not just an abstract alert.
- Selected relations render as clickable chips with quick-open action.
- List views show ready / blocked / proof-gap states before the detail page opens.
- Review / publish / rollback / media flows still work.
- No page-builder territory is introduced.
- No operator-critical task takes more clicks than the current baseline unless the stage removes another mandatory step or owner approval is recorded.

## 13. Verification plan

The verification plan is deliberately repetitive so that the agent can execute it without inventing its own QA style.

### Manual flows to run

- Open `/admin` and verify the cockpit, coverage and next actions.
- Open an empty or partial cockpit state and verify that it is not rendered as healthy.
- Open a `service` editor, inspect the `SEO / truth` section, and click a readiness blocker.
- Open a `case` editor, verify linked services and proof-related fields.
- Open a `page` editor for the current first-slice page type and verify page-type-specific truth.
- Open `global_settings`, verify contact truth and the global operator layer.
- Open the evidence surface from cockpit and from an editor.
- Open a linked relation from a chip or summary.
- Open a linked relation, return to the originating screen, and verify context is still preserved.
- Check a list page for readiness badges.
- Run review, publish, history and media flows to confirm they still behave as before.

### Tests to add or update

- DTO projection tests.
- Anchor resolution tests.
- Readiness-to-field navigation tests.
- Evidence projection tests.
- Relation summary tests.
- List badge tests.
- Route smoke checks for dashboard, editor, review, publish, history and media surfaces.

### Mandatory checks

- `npm test`
- `npm run build`
- A manual smoke pass for `/admin`, one editor, one review page, one publish page, one media workspace and one list page.
- A manual click-count sanity check for the core operator flows against the current baseline.

## 14. Risks and boundary protection

### Scope creep

Risk: the cockpit expands into a general CMS dashboard or analytics screen.  
Protection: keep each stage tied to the first slice and to operator actions.

### Dashboard theater

Risk: the cockpit looks busy but does not help the operator act.  
Protection: every panel must link to a concrete action or show a truthful empty state.

### Editor regression

Risk: changing the editor breaks current save / review / publish flow.  
Protection: augment existing surfaces instead of replacing them.

### Relation overengineering

Risk: checklist UX gets replaced by a graph system.  
Protection: chips, summary and quick-open only.

### Duplicate readiness logic

Risk: the frontend starts computing its own truth.  
Protection: consume canonical readiness outputs and project them.

### Evidence confusion

Risk: evidence becomes a second truth store.  
Protection: evidence remains a projection over current truth unless an owner decision explicitly changes the canon.

### Empty/error state blindness

Risk: the new surfaces look clean but hide partial data absence.  
Protection: every stage must define empty and fallback states before shipping.

## 15. Definition of done

The epic is done only when all of the following are true:

1. `/admin` is a real cockpit with next actions, coverage and visible gaps.
2. The first-slice coverage set is visible from admin without multiple entity jumps.
3. Readiness blockers lead to the correct fix location.
4. `service`, `case`, `page`, `global_settings` expose an explicit operator-facing SEO / truth layer.
5. Evidence is visible as a projection rather than guessed from scattered fields.
6. Relations are more navigable than checklist-only.
7. List views surface useful readiness or gap signals.
8. Review / publish / rollback / media still work.
9. Build and tests are green.
10. No page-builder or broad platform drift happened.
11. Every stage has a proof package.
12. Any stop trigger encountered was explicitly escalated, not silently worked around.
