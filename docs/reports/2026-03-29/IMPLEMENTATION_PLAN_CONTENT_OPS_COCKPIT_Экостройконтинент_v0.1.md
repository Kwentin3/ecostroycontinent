# Implementation Plan for SEO/content-ops cockpit in admin console

Дата: 2026-03-29  
Тип: `planning` / `autonomous-execution-ready` / `implementation design`

## 1. Executive summary

Этот эпик делает admin frontend заметно более удобным рабочим инструментом для SEO/content operator, который не рисует страницы, а заводит, связывает и доводит до review/publish контентные данные.

Что должно получиться:

- единая content-ops cockpit surface;
- видимая launch-core coverage сводка;
- evidence / proof visibility как отдельная рабочая перспектива;
- action-oriented readiness UX;
- явный `SEO / truth` слой в editor flows;
- более удобная работа со связями между сущностями;
- более честная list-level visibility по готовности и пробелам.

Почему это в текущем приоритете:

- audit показал, что admin foundation уже сильная;
- главный UX gap сейчас не в backend и не в public site, а в том, что оператору приходится помнить слишком много внутренней схемы;
- эпик закрывает именно этот gap и не расширяет scope до page builder или полного SEO platform.

## 2. Canon and scope framing

### Canon sources

План опирается на фактический канон из репозитория и на два последних аудита:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md`
- `docs/product-ux/Admin_UI_Implementation_Conventions_First_Slice_Экостройконтинент_v0.1.md`
- `docs/product-ux/Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`
- `docs/reports/2026-03-29/PRD_vs_Code_Audit_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-03-29/FRONT_AUDIT_CONTENT_OPS_SEO_Экостройконтинент_v0.1.report.md`

### In scope

- content-ops cockpit surface;
- launch-core coverage panel;
- evidence register surface or drawer;
- action links from readiness blockers to concrete editor anchors;
- explicit `SEO / truth` sections in `service`, `case`, `page`, `global_settings`;
- relation UX improvements;
- list-level readiness / gap markers;
- supporting data projection and UI plumbing;
- tests and non-regression checks for the above.

### Out of scope

- page builder;
- visual page composition;
- broad public-site redesign;
- broad analytics dashboards;
- full SEO platform;
- later-slice expansion just to grow scope;
- rewriting the admin frontend from scratch.

### Why page builder is intentionally excluded

- the current canon defines admin as a content operations tool, not a visual builder;
- the current first slice already has enough structure for `service`, `case`, `page`, `media` and `gallery`;
- the real gap is operational visibility and actionability, not the lack of a canvas;
- adding a builder would drag the epic into a different product class and blur the cockpit goal.

### Prompt-to-repo note

The prompt names a few context docs that are renamed in the repository. For execution, the actual canonical files above should be treated as source of truth.

## 3. Current state summary

### What already exists and should be reused

| Surface | Current value | Reuse posture |
| --- | --- | --- |
| `components/admin/AdminShell.js` | role-aware shell, nav, breadcrumbs, infra health, logout | keep as shell grammar foundation |
| `components/admin/EntityEditorForm.js` | editable first-slice entities, relations, SEO fields, readiness, publish actions | extend, do not replace |
| `components/admin/ReadinessPanel.js` | blocking / warning / info presentation | make it more action-oriented |
| `components/admin/MediaGalleryWorkspace.js` | full media workspace with inspector, collections, edit overlay, lifecycle | keep as strong base |
| `components/admin/MediaCollectionOverlay.js` | collection editor inside media workspace | reuse for relation/navigation patterns |
| `components/admin/MediaImageEditorPanel.js` | crop / rotate / flip / reset | reuse as-is unless a specific bug appears |
| `components/admin/TimelineList.js` | audit / history narrative | reuse for proof and history context |
| `app/admin/(console)/page.js` | dashboard / action queue | extend into cockpit |
| `app/admin/(console)/review/[revisionId]/page.js` | review + diff + preview | keep as review center |
| `app/admin/(console)/revisions/[revisionId]/publish/page.js` | publish gate | keep as publish gate |
| `app/admin/(console)/entities/[entityType]/page.js` | list view | add visibility and gap markers |
| `app/admin/(console)/entities/[entityType]/[entityId]/page.js` | detail editor | add SEO/truth and actionability |
| `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js` | history and rollback | keep as safety loop |

### Gaps confirmed by audit

- no dedicated launch-core inventory / evidence surface;
- readiness blockers are visible but not always directly actionable;
- SEO truth is present but buried in generic editor flow;
- relation UX works, but still feels checklist-like;
- there is no single cockpit surface that merges next actions, coverage, blockers and proof gaps.

### What must not be redone

- content-core schema and workflow semantics;
- review / publish / rollback flow;
- media storage architecture;
- role-based access control;
- current admin shell grammar;
- current entity editor data model for the first slice.

## 4. Target outcome

После эпика admin frontend должен ощущаться не как набор отдельных CRUD экранов, а как рабочий cockpit для SEO/content operator.

### Desired operator feel

| Current pain | Target feel |
| --- | --- |
| нужно помнить, где искать readiness, proof и next steps | одна cockpit surface показывает это заранее |
| blocker есть, но путь исправления неочевиден | blocker ведет к точному полю или секции |
| SEO truth спрятан среди generic form controls | SEO / truth слой выделен явно |
| relations похожи на список чекбоксов | relations читаются как связи и навигация |
| evidence scattered across screens | proof state visible in one place |
| list views требуют открытия detail page, чтобы понять риск | list views уже сигналят о readiness / gaps |

### Surfaces that should exist or be improved

- dashboard cockpit card;
- launch-core coverage panel;
- evidence register drawer or panel;
- editor-level SEO / truth sections;
- relation chips and quick-open behavior;
- list badges and gap markers;
- readiness-to-field navigation.

## 5. Implementation strategy

### Strategy principles

1. Start from projections, not from a new canonical store.
2. Reuse the existing server-derived truth.
3. Augment current surfaces before creating new routes.
4. Keep the first slice narrow and operator-centric.
5. Prefer visible actionability over more metrics.

### Order of change

1. Build shared data projection helpers and field-anchor contracts.
2. Add cockpit / coverage surface on top of the existing dashboard.
3. Make readiness actionable inside editor and review surfaces.
4. Expose explicit SEO / truth sections in editors.
5. Add evidence register surface as a projection, not a new truth store.
6. Improve relation UX and list-level visibility.
7. Harden with tests and non-regression checks.

### Dependency rule

The new surfaces should depend on existing canonical helpers such as:

- `evaluateReadiness`;
- `getReviewQueue`;
- `getEntityEditorState`;
- `listEntityCards`;
- `listMediaLibraryCards`;
- `listCollectionLibraryCards`;
- `buildPublishedLookups`;
- `getPublishedGlobalSettings`;
- `listPublishObligations`.

The plan should not introduce a second readiness engine or a second truth store in the frontend.

## 6. Work breakdown structure

### 6.1 Shared data plumbing and cockpit DTOs

| Item | Plan |
| --- | --- |
| Goal | Create a small shared projection layer for cockpit / coverage / evidence / list badges. |
| What changes | Add helper modules that aggregate existing admin and content-core data into operator-friendly DTOs. |
| Likely impact zone | `lib/admin/*`, possibly a new cockpit helper module рядом с `entity-ui.js` and `media-gallery.js`. |
| Dependencies | Existing server-side truth helpers and readiness results. |
| Risks | Duplicating backend logic; inventing a second evidence model. |
| Expected artifacts | `content-ops-cockpit` helper, coverage DTO, evidence-gap DTO, list-badge DTO, field-anchor map. |

### 6.2 Dashboard / cockpit layer

| Item | Plan |
| --- | --- |
| Goal | Turn `/admin` into a cockpit that shows next actions, coverage, blockers and proof gaps. |
| What changes | Add a cockpit card and launch-core coverage panel to the dashboard. |
| Likely impact zone | `app/admin/(console)/page.js`, new cockpit components under `components/admin/`. |
| Dependencies | 6.1 data plumbing. |
| Risks | Dashboard theater if the surface is only informational and not actionable. |
| Expected artifacts | `ContentOpsCockpitPanel`, `LaunchCoreCoveragePanel`, dashboard action links, current state summary. |

### 6.3 Readiness actionability

| Item | Plan |
| --- | --- |
| Goal | Make blockers and warnings lead to concrete fixes. |
| What changes | Map readiness result `field` values to stable editor anchors; add jump links from readiness surfaces. |
| Likely impact zone | `components/admin/ReadinessPanel.js`, `components/admin/EntityEditorForm.js`, `app/admin/(console)/review/[revisionId]/page.js`, `app/admin/(console)/revisions/[revisionId]/publish/page.js`. |
| Dependencies | 6.1 projection layer and a field-anchor map. |
| Risks | If the field semantics are unclear, the jump links become misleading. |
| Expected artifacts | `editor-field-anchors` helper, clickable blocker rows, exact field scroll targets. |

### 6.4 Explicit SEO / truth sections

| Item | Plan |
| --- | --- |
| Goal | Make SEO truth visible as a first-class editor layer. |
| What changes | Group SEO-related fields into explicit sections and add operator-friendly labels / explanations. |
| Likely impact zone | `components/admin/EntityEditorForm.js`, `lib/admin/screen-copy.js`, `lib/ui-copy.js`, possibly a small `TruthSection` component. |
| Dependencies | 6.1 and 6.3. |
| Risks | Overcomplicating forms or moving into builder-like composition. |
| Expected artifacts | explicit `SEO / truth` blocks in `service`, `case`, `page`, `global_settings` editors. |

### 6.5 Evidence register surface

| Item | Plan |
| --- | --- |
| Goal | Make proof / evidence state visible without requiring the operator to infer it from scattered editor fields. |
| What changes | Build a drawer or panel that projects readiness codes, audit items, obligations, media usage and missing proof signals into an evidence-focused view. |
| Likely impact zone | new component under `components/admin/`, integration in dashboard and editor pages. |
| Dependencies | 6.1 data projection; 6.3 readiness mapping. |
| Risks | If evidence semantics drift away from readiness truth, the surface becomes confusing. |
| Expected artifacts | `EvidenceRegisterDrawer` or `EvidenceRegisterPanel`, evidence-gaps list, proof-focused filters. |

### 6.6 Relation UX improvements

| Item | Plan |
| --- | --- |
| Goal | Reduce checklist-only feeling and make relations feel navigable. |
| What changes | Add relation chips, quick-open actions, relation summaries, and where-used cues. |
| Likely impact zone | `components/admin/FilterableChecklist.js`, `components/admin/MediaPicker.js`, `components/admin/MediaGalleryWorkspace.js`, `components/admin/MediaCollectionOverlay.js`, `components/admin/EntityEditorForm.js`. |
| Dependencies | 6.1 projection layer, maybe 6.4 if relation summary references SEO/truth sections. |
| Risks | Overbuilding a relation graph instead of improving the simple current flow. |
| Expected artifacts | `RelationChipRow`, quick-open links, relation summary badges, improved selected-state clarity. |

### 6.7 List-level visibility improvements

| Item | Plan |
| --- | --- |
| Goal | Surface readiness and gaps earlier in list views. |
| What changes | Add badges, gap markers, and readiness indicators to entity lists and possibly media cards. |
| Likely impact zone | `app/admin/(console)/entities/[entityType]/page.js`, `components/admin/MediaGalleryWorkspace.js`, maybe dashboard cards. |
| Dependencies | 6.1 projection layer. |
| Risks | Visual clutter if too many signals are added without hierarchy. |
| Expected artifacts | row badges, proof-gap markers, publish-ready indicators. |

### 6.8 Tests and QA

| Item | Plan |
| --- | --- |
| Goal | Prove the new cockpit improves operator UX without regressing current flows. |
| What changes | Add helper tests and flow tests around projections, anchors, and key admin routes. |
| Likely impact zone | `tests/*`, possibly new focused admin integration tests. |
| Dependencies | All implementation bands. |
| Risks | Snapshot-only confidence or tests that overfit the new UI. |
| Expected artifacts | helper unit tests, route smoke checks, regression coverage for review/publish/media. |

## 7. Autonomous execution bands

### Band A: foundation and projections

| Aspect | Details |
| --- | --- |
| Can do without owner decision | Build projection helpers, coverage DTOs, evidence-gap DTOs, field-anchor maps, and supporting labels using existing canon. |
| What is already defined | First-slice entities, readiness semantics, workflow semantics, current admin surfaces. |
| Stop triggers | If the implementation needs new canonical data fields, new entity types, or a persisted evidence store. |
| Owner review needed | Only if the new projection cannot be expressed from existing readiness / audit / relation data. |

### Band B: cockpit and coverage surface

| Aspect | Details |
| --- | --- |
| Can do without owner decision | Add cockpit cards and launch-core coverage panels using the projection helpers. |
| What is already defined | `/admin` as a role-aware starting point and first-slice launch-core scope. |
| Stop triggers | If the cockpit starts requiring new business KPIs or broad analytics. |
| Owner review needed | If the exact launch-core slate is still not settled and the panel needs a canonical list. |

### Band C: readiness actionability and SEO / truth sections

| Aspect | Details |
| --- | --- |
| Can do without owner decision | Add field anchors, blocker jump links, and explicit SEO / truth sections using existing editor fields. |
| What is already defined | Readiness result codes and current editor data model. |
| Stop triggers | If field semantics are ambiguous or a blocker cannot be mapped to an exact field / section. |
| Owner review needed | If the implementation requires wording or field grouping changes that alter canon. |

### Band D: evidence register and relation UX

| Aspect | Details |
| --- | --- |
| Can do without owner decision | Build the evidence projection surface, relation chips, quick-open links, and where-used summaries using existing entity relationships. |
| What is already defined | Evidence is a visibility layer over existing proof/readiness signals, not a new truth source. |
| Stop triggers | If evidence becomes a new persisted model, or if relation UX needs new relation types / roles. |
| Owner review needed | If the team wants a new canonical evidence taxonomy or expanded relation semantics. |

### Band E: list visibility and hardening

| Aspect | Details |
| --- | --- |
| Can do without owner decision | Add list badges, gap markers, and regression tests. |
| What is already defined | Existing list pages, media workspace, and review/publish flows. |
| Stop triggers | If the badges introduce misleading state or require a backend redesign. |
| Owner review needed | If the team wants new list-level business signals beyond current canon. |

### Parallelization note

Bands B and C can usually be split into separate workers after Band A, provided their write sets are disjoint. Band D should wait until the field-anchor and projection contract is stable.

## 8. Success criteria

| Criterion | How to observe |
| --- | --- |
| Launch-core coverage is visible from admin entry points. | `/admin` shows coverage and gaps without opening multiple detail pages. |
| Blockers become actionable. | Clicking a blocker jumps to the relevant field or section. |
| SEO / truth is explicit. | `service`, `case`, `page`, `global_settings` editors show a clear operator-facing truth layer. |
| Evidence is visible. | The operator can see proof / evidence state without reading raw audit or guessing from scattered fields. |
| Relations feel navigable. | Linked entities can be opened quickly and relation context is preserved. |
| Lists carry useful signals. | Entity list rows show readiness / gap indicators before the detail page is opened. |
| Current flows survive. | Review / publish / rollback / media flows still work as they do now. |
| Scope stays narrow. | The implementation does not drift into page builder or a broad SEO platform. |

## 9. Acceptance criteria

### UX acceptance

| Criterion | Check |
| --- | --- |
| Cockpit surface is visible and understandable. | Operator can answer "что готово / что не готово / что нужно сделать дальше" from the cockpit. |
| Readiness is readable. | Blocking and warning states are visually distinct and carry a clear next step. |
| Truth sections are explicit. | SEO / truth fields are no longer just a generic tail of form controls. |
| Relations are clear. | Selected relations are summarized as relations, not only as a checklist. |

### Functional acceptance

| Criterion | Check |
| --- | --- |
| Coverage numbers are truthful. | Coverage panel matches current entity and media data. |
| Evidence register is projection-only. | It reflects canonical readiness / audit / relation data, not a new backend source of truth. |
| Blocker navigation works. | Each mapped blocker can land on the correct field or section. |
| Quick-open works. | Relation chips and pickers open the right target entity. |

### Workflow acceptance

| Criterion | Check |
| --- | --- |
| Create -> link -> review -> publish flow still works. | Service / case / page workflows remain usable with the new surfaces. |
| Media workflow is preserved. | Upload, inspect, edit, collection management, archive / restore still work. |
| History and rollback are preserved. | Existing safety loop remains intact. |
| Role boundaries remain intact. | Superadmin / SEO manager / business owner access rules do not change unintentionally. |

### Non-regression acceptance

| Criterion | Check |
| --- | --- |
| Existing admin routes still render. | Dashboard, entity lists, detail editors, review, publish, history and media routes stay reachable. |
| Build and tests stay green. | `npm test` and `npm run build` pass after implementation. |
| No page-builder territory leaked in. | No new visual composition system is introduced under this epic. |
| No duplicate readiness logic appears. | Frontend consumes canonical readiness data instead of re-implementing it. |

## 10. Verification plan

### Manual flows to run

| Flow | What to verify |
| --- | --- |
| Dashboard / cockpit | operator sees coverage, next actions, blockers and proof gaps in one place |
| Create service | new service can be drafted, related, checked for readiness, and sent to review |
| Edit case | case can be updated with media and linked services without losing context |
| Global settings | contact / truth state is visible and understandable |
| Review detail | diff, preview and owner action remain clear |
| Publish readiness | blockers disable publish and point to the fix |
| History / rollback | published version can still be rolled back safely |
| Media workspace | upload, inspect, edit, collection management and usage visibility still work |

### Tests to add or update

| Test area | Purpose |
| --- | --- |
| Projection helper tests | coverage, evidence, and badge DTOs stay truthful |
| Anchor mapping tests | readiness `field` codes map to the correct editor anchors |
| Relation summary tests | chips / quick-open points to the right entities |
| Route smoke tests | key admin routes still render and respect role boundaries |
| Non-regression tests | review / publish / media / history workflows remain intact |

### Mandatory checks

- `npm test`
- `npm run build`
- manual verification of dashboard, entity editor, review, publish and media flows

## 11. Stop triggers and escalation points

| Stop trigger | Why stop | Escalate to owner for |
| --- | --- | --- |
| Cockpit needs a new canonical data model | That would move the work from projection to product design. | Confirm whether new persistent state is allowed. |
| Evidence surface needs new truth semantics | Evidence should not silently become a new source of truth. | Confirm evidence taxonomy and ownership. |
| Readiness blockers cannot map cleanly to fields | The UI would be misleading. | Confirm canonical field groupings or wording. |
| Relation UX starts requiring new relation types | That is a canonical change, not just UI polish. | Confirm relation model extensions. |
| The work drifts into page-builder / visual composition | That violates the scope boundary. | Re-scope back to content operations. |
| Coverage panel needs broad analytics | That is a dashboard platform decision, not a cockpit tweak. | Confirm whether analytics are in scope. |

## 12. Risks and boundary protection

### Scope creep

Risk: the cockpit turns into a general CMS dashboard or a launch-site analytics screen.  
Protection: keep the scope limited to first-slice entities, readiness, evidence and next actions.

### Dashboard theater

Risk: the cockpit looks informative but does not help the operator act.  
Protection: every coverage / evidence signal must either link to work or explain why it is blocked.

### Editor regression

Risk: reworking editors breaks the current review / publish rhythm.  
Protection: augment current editors instead of replacing them; keep save / submit / publish paths intact.

### Relation overengineering

Risk: the team invents a graph editor while trying to fix checklist-like UX.  
Protection: start with chips, summaries and quick-open. No graph editor in this epic.

### Duplicate readiness logic

Risk: the frontend re-implements business checks and drifts from canonical readiness.  
Protection: read readiness from the canonical layer and only project it in UI-friendly form.

### Evidence confusion

Risk: evidence becomes a new store with vague semantics.  
Protection: keep evidence as a projection over current readiness, audit and relation state unless a separate owner decision says otherwise.

## 13. Recommended execution order

1. Build shared projection helpers and field-anchor mappings first. Reason: every later surface depends on truthful DTOs and navigation targets.
2. Add the dashboard cockpit and launch-core coverage panel next. Reason: it gives immediate operator value and validates the projection layer.
3. Implement readiness actionability and explicit SEO / truth sections in the editors. Reason: this removes the highest-friction operator pain.
4. Add the evidence register surface. Reason: it becomes meaningful once coverage and readiness are already visible.
5. Improve relation UX with chips, summaries and quick-open. Reason: these changes reuse the same projection layer and reduce checklist fatigue.
6. Add list-level badges and gap markers. Reason: they are useful once the cockpit and editor semantics are stable.
7. Finish with tests, hardening and non-regression cleanup. Reason: this locks in the new operator model without touching canonical flows.

### Parallelization guidance

- Band B and Band C can run in parallel after Band A if separate workers own disjoint files.
- Band D should wait for anchor mappings and projection helpers to be stable.
- Band E should be last so list badges reflect the final cockpit semantics.

## 14. Proposed deliverables

| Category | Deliverables |
| --- | --- |
| UI surfaces | cockpit card, launch-core coverage panel, evidence register drawer / panel, explicit SEO / truth sections, relation chips, list badges |
| Shared helpers | cockpit projection helper, coverage DTO builder, evidence DTO builder, editor field-anchor helper |
| File updates | `app/admin/(console)/page.js`, `components/admin/EntityEditorForm.js`, `components/admin/ReadinessPanel.js`, `components/admin/MediaGalleryWorkspace.js`, `components/admin/MediaCollectionOverlay.js`, `components/admin/FilterableChecklist.js`, `components/admin/MediaPicker.js`, list pages |
| Tests | projection helper tests, anchor mapping tests, relation summary tests, route smoke / non-regression tests |
| Docs | this implementation plan; optional small appendix update to UI conventions if the new cockpit grammar stabilizes |

## 15. Definition of done

Эпик считается done, когда:

1. `/admin` показывает cockpit / coverage / next action view, а не только общий queue.
2. Operator can see launch-core coverage, readiness gaps and proof gaps without jumping through multiple entity detail pages.
3. Readiness blockers can lead to concrete field anchors.
4. `service`, `case`, `page`, `global_settings` expose an explicit operator-friendly SEO / truth layer.
5. Relation UX is more navigable than checklist-only.
6. List views surface readiness / proof gaps early.
7. Review / publish / rollback / media flows still work.
8. Build and tests stay green.
9. No page-builder / visual composition scope leaked into the epic.
10. The implementation depends on canonical projections, not on duplicate frontend business logic.

