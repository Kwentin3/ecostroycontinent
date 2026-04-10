# IMPLEMENTATION.PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.V1.report

## 1. Executive Summary

Подготовлен staged implementation/refactor plan для перехода к новой single-workflow model в домене `Страницы`.

Главный вывод: безопасный путь лежит не через большой переписывательский заход, а через последовательное разрезание четырёх ключевых швов:
- peer-nav и peer-route narrative вокруг `AI-верстка`;
- dual-save path в canonical `Page` truth;
- hidden metadata carry-through внутри workspace draft;
- split preview contract между workspace и review/public renderer.

Рекомендуемая стратегия: несколько epics с временной совместимостью. Сначала убирается peer-surface narrative и фиксируется Pages-first navigation, затем вводится unified page workspace shell, потом режутся metadata/save/preview seams, и только после этого вычищается legacy workspace.

## 2. Source Docs and Source Contracts

### Primary source docs read

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/reports/2026-04-10/ADMIN.ANAMNESIS.AI_LAYOUT_VS_PAGES_AUDIT.v1.md`
- `docs/reports/2026-04-10/DOCS.REFINE.PAGES_SINGLE_WORKFLOW.V1.report.md`

### Refined/aligned narrow docs read

- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`
- `docs/engineering/LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
- `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/LLM_INFRA_DOMAIN_MAP_v1.md`

### Source contracts treated as preserved

- Canonical `Page` payload normalization in `lib/content-core/pure.js:42-130`
- Generic draft persistence in `lib/content-core/service.js`
- Explicit review/publish/rollback workflow in `lib/content-ops/workflow.js`
- Canonical review preview rendering in `app/admin/(console)/review/[revisionId]/page.js:178-187`
- Public standalone page renderer in `components/public/PublicRenderers.js:197-307`

## 3. Target Model Recap

Target state for implementation is now clear and fixed by documentation:

- One user domain: `Страницы`.
- `Страницы` registry is the only first entry.
- Registry opens in cards mode by default, with search, filters and `Карточки / Список` toggle.
- Card click opens the unified main page workspace.
- Main page workspace has center canvas, compact left launchers and pinned right AI panel.
- Metadata is a separate tabbed movable modal, page-owned but not first-layer.
- Page composition and connective copy remain page-owned.
- AI is embedded assistive only, not a top-level screen and not a second owner.
- Publish/review/history semantics remain unchanged.

## 4. Seams Found in Current Architecture

### 4.1 Navigation and route seams

- `components/admin/AdminShell.js:9-18` and `lib/admin/nav.js:3-10` still expose `/admin/workspace/landing` as top-level peer nav item `AI-верстка`.
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js:82-85` still sends Page users into a separate workspace route.
- `app/admin/(console)/workspace/landing/page.js:21-103` is still a dedicated chooser surface with its own breadcrumb and entry narrative.

### 4.2 Save-path seams

- `app/api/admin/workspace/landing/[pageId]/route.js:221-257` saves manual workspace edits into canonical `Page` draft.
- `app/api/admin/workspace/landing/[pageId]/route.js:424-433` saves AI-generated candidate into canonical `Page` draft.
- This means the old workspace is not just assistive UI; it is a live second write path.

### 4.3 Projection / adapter seams

- `lib/admin/entity-ui.js:92-125` maps canonical `Page` payload into flat editor fields.
- `lib/content-core/pure.js:42-130` maps flat editor fields back into canonical `Page` payload.
- `lib/landing-workspace/landing.js:338-377` maps `Page` payload into workspace draft.
- `lib/landing-workspace/landing.js:380-406` maps workspace draft back into page payload.
- `lib/landing-workspace/landing.js:459-467` creates preview-specific payload.

This is the expensive seam: one entity truth, multiple editing projections, multiple save narratives.

### 4.4 Hidden stale-overwrite seam

- `lib/admin/landing-workspace-ui.js:66-95` keeps full workspace draft state including metadata-like fields.
- `lib/landing-workspace/landing.js:348-377` and `:380-406` silently carry `slug`, `pageType`, `seo`.
- `components/admin/LandingWorkspaceStageAScreen.js:523-530` posts serialized `payloadJson` back as hidden full draft.

This creates real stale overwrite risk when metadata and composition are edited from different surfaces.

### 4.5 Preview seam

- `components/admin/LandingWorkspaceStageAScreen.js:332-412` renders a local preview implementation.
- `app/admin/(console)/review/[revisionId]/page.js:178-187` renders the canonical preview path.

The UX can be unified while the preview truth remains split, so this seam needs its own phase.

### 4.6 Left-rail / support-rail UX seams

- `components/admin/LandingWorkspaceStageAScreen.js:537-560` shows the long left warehouse of source cards.
- `components/admin/LandingWorkspaceStageAScreen.js:909-977` keeps a right rail that mixes blockers, helper text, generate and review actions in a way that still feels like a pseudo-editor rather than a lightweight assistant.

## 5. Proposed Phases

### Phase A. Navigation and IA alignment

Purpose:
- remove peer top-level `AI-верстка` narrative;
- lock `Страницы` as the only domain entry.

Expected effect:
- no top-level AI nav item;
- legacy workspace routes remain only as compatibility paths.

### Phase B. Registry screen refactor

Purpose:
- make `Страницы` registry the only first-layer entry point.

Expected effect:
- cards by default;
- list as secondary view;
- search/filters;
- minimal cards with three-dots actions.

### Phase C. Main page workspace shell

Purpose:
- introduce one page workspace route and shell under the Pages domain.

Expected effect:
- one screen for page work;
- no forced hop into peer workspace;
- temporary reuse of legacy internals allowed only behind the new shell.

### Phase D. Metadata management layer

Purpose:
- cut hidden metadata carry-through and separate frequent vs rare fields.

Expected effect:
- page-owned metadata modal;
- explicit save/apply path for metadata;
- no hidden `slug`/`pageType`/SEO overwrite via composition save.

### Phase E. Source launchers and specialized pickers

Purpose:
- replace left-rail warehouse with launcher icons and pickers.

Expected effect:
- compact first layer;
- specialized modals for `Media`, `Cases`, `Services`;
- page-owned ids/order preserved.

### Phase F. Composition and connective copy

Purpose:
- embed connective copy into page-owned composition workflow.

Expected effect:
- inline bridge-text editing in context;
- no detached bridge entity by default.

### Phase G. AI panel integration

Purpose:
- demote AI from pseudo-editor to embedded assistant.

Expected effect:
- bounded AI actions in right panel;
- accepted AI output goes through page-owned session, not a rival save path.

### Phase H. Preview unification

Purpose:
- align page-work preview with canonical review/public semantics.

Expected effect:
- one preview contract;
- no divergent preview-only representation.

### Phase I. Legacy decommission

Purpose:
- remove or deprecate remaining dual-screen leftovers only after the new path is stable.

Expected effect:
- chooser removed or redirected;
- duplicate save path removed;
- legacy preview and peer route semantics cleaned up.

## 6. Contract-Level Impacts

| Contract | Status | Implementation implication |
| --- | --- | --- |
| Page payload contract | stays unchanged initially | Avoid schema rewrite; allow only narrow extension if connective-copy UX truly needs it |
| Metadata handling | needs adapter | Move metadata to modal, eliminate hidden carry-through |
| `saveDraft` / revision flow | stays unchanged | Keep lifecycle, converge callers |
| Preview contract | needs adapter, then unification | Reuse canonical preview path inside page workspace |
| Source picker contract | needs narrow extension | Modal returns selected refs/order only |
| AI action contract | needs adapter | Suggestions or bounded patches, not full rival payload save |
| Composition / connective copy | needs narrow extension or bounded adapter | Keep page-owned, no detached bridge entity |
| Nav / route contract | needs deprecation plan | Legacy workspace routes become redirects/wrappers |
| Publish / review / history invariants | stays unchanged | Keep explicit downstream semantics intact |

## 7. Risks

### Top risks

1. **Ownership drift survives behind a new shell**  
   If the new page workspace still uses a competing AI/full-payload save path, the UI changes but the drift remains.

2. **Hidden stale overwrite survives**  
   If composition saves still serialize metadata fields, modal separation becomes cosmetic.

3. **Preview mismatch survives**  
   If workspace preview remains local while review/public stays canonical, operators still edit against a different truth.

4. **AI panel re-grows into pseudo-editor**  
   If AI continues to mutate full page state or metadata directly, the product returns to shadow ownership.

5. **Scope drift into page-builder product**  
   Connective-copy and canvas work can easily trigger overgeneralized layout freedom.

### Detection signals called out in the plan

- more than one route/surface still writes full `Page` payloads;
- metadata changed in modal then overwritten by composition save;
- review preview differs materially from page-work preview;
- left rail accumulates long source stacks again;
- implementation introduces generic canvas/layout abstractions without explicit decision.

## 8. Gating Decisions

These questions should be explicitly decided before coding starts or before the relevant phase is opened:

1. **Canonical page-work route shape**  
   Should the unified workspace live directly at `/admin/entities/page/[pageId]` or under a nested technical route?

2. **Metadata field partition**  
   Which fields stay visible in the main workspace, and which become metadata-only in the first implementation slice?

3. **Connective-copy representation**  
   Can first slice reuse bounded existing page fields, or is a narrow page-composition extension required?

4. **AI apply semantics**  
   Should AI apply block-by-block patches or bounded candidate acceptance, provided it does not save hidden full payloads?

5. **Preview unification path**  
   Should the new workspace reuse the exact review renderer immediately, or first go through a shared canonical preview adapter?

## 9. What I Explicitly Deferred

- Deep renaming of legacy filenames like `landing-workspace` and `landing-factory`.
- Broad redesign of `Page` persistence schema.
- Expansion into generic page-builder abstractions.
- Broad LLM / memory-card infra cleanup that does not directly affect screen ownership or save-path semantics.
- Any runtime refactor of publish/review/history mechanics.

These were deferred intentionally to keep the plan within the agreed target model and avoid reopening project canon.

## 10. Recommended Next Step

The next execution step should be an implementation prompt scoped to **Phase A + Phase B + route decision freeze**.

Reason:
- it removes the most dangerous user-facing drift early;
- it creates the correct Pages-first entry before deeper workspace refactor starts;
- it gives the team a stable shell for later phases without forcing a big-bang rewrite.

### Suggested next prompt for implementation agent

> Реализуй Phase A и Phase B из `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`: убери top-level nav narrative `AI-верстка`, зафиксируй `Страницы` как единственный first-entry domain, переведи реестр страниц в cards-first model с toggle `Карточки / Список`, search, filters и minimal page cards, при этом legacy `/admin/workspace/landing*` пока не удаляй, а переведи в compatibility/redirect posture. Не трогай publish/review/history, не вводи page-builder abstraction и не меняй canonical `Page` payload contract.
