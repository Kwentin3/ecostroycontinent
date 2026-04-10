# Implementation Execution Report

## 1. Executive Summary

Single-workflow model for the `Page` domain is now implemented in code.

User-visible flow is reduced to one domain: `Страницы`.

- The top-level peer surface `AI-верстка` is removed from admin navigation.
- `/admin/entities/page` is now the primary registry entry and renders a cards-first page registry with search, filters, `Карточки / Список`, minimal page cards, and metadata access from the three-dots menu.
- `/admin/entities/page/[pageId]` is now the unified page workspace with:
  - left launcher rail,
  - center page-owned canvas,
  - right pinned AI assistive panel,
  - metadata managed through a movable tabbed modal.
- Legacy `/admin/workspace/landing*` routes remain only as compatibility redirects.
- Legacy `/api/admin/workspace/landing/[pageId]` no longer saves anything and is deprecated into an error redirect back to the canonical Pages workflow.
- Page save/apply semantics now converge on the canonical `Page` draft flow through `/api/admin/entities/page/[pageId]/workspace`.
- AI no longer has a hidden peer write-path. It only returns bounded explicit patches.
- Preview in the page workspace now uses canonical `StandalonePage` rendering instead of a workspace-only renderer.

The epic was delivered without a big-bang rewrite. Transitional compatibility remains only where it protects deep links and stale integrations.

## 2. Source Docs and Contracts Used

Primary source docs read and used:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/reports/2026-04-10/ADMIN.ANAMNESIS.AI_LAYOUT_VS_PAGES_AUDIT.v1.md`
- `docs/reports/2026-04-10/DOCS.REFINE.PAGES_SINGLE_WORKFLOW.V1.report.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`

Aligned supporting docs consulted:

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

Canonical contracts preserved:

- `Page` remains canonical owner of standalone page truth and page composition.
- `saveDraft()` and revision lifecycle remain canonical write-side persistence.
- publish / review / history remain explicit downstream operations.
- AI remains assistive-only and never becomes source of truth.
- no detached connective-copy entity was introduced.

## 3. Gating Decisions Taken

### 3.1 Canonical page-work route shape

Decision: use `/admin/entities/page/[pageId]` as the unified page workspace route.

Reason:

- it keeps the workspace inside the canonical `Page` domain;
- it removes the route-level peer narrative;
- it preserves route ownership under `Page` instead of inventing a second workspace root.

### 3.2 Metadata partition

Decision:

- Main workspace keeps frequent visible-copy and composition fields:
  - `title`
  - `h1`
  - `intro`
  - `body`
  - `contactNote`
  - `ctaTitle`
  - `ctaBody`
  - `defaultBlockCtaLabel`
  - `primaryMediaAssetId`
  - `serviceIds`
  - `caseIds`
  - `galleryIds`
- Metadata modal owns rare and service fields:
  - `slug`
  - `pageType`
  - `pageThemeKey`
  - `seo.*`

Reason:

- this removes hidden carry-through;
- route and SEO truth are edited explicitly, not piggybacked on composition save;
- the canvas stays light enough for the intended SEO operator posture.

### 3.3 Connective-copy representation

Decision: bounded reuse of the current page payload structure.

- connective copy remains `body` inside page-owned composition;
- contacts flow keeps page-owned `contactNote`;
- no bridge entity or external reusable content record was introduced.

### 3.4 AI apply semantics

Decision: bounded patch apply.

- AI returns suggestion patches only;
- patches are local until explicitly applied by the operator;
- canonical truth changes only after explicit page save;
- AI cannot silently mutate metadata, route fields, publish state, or ownership fields.

### 3.5 Preview convergence mechanism

Decision: direct canonical renderer reuse.

- page workspace preview now uses `StandalonePage`;
- no temporary workspace-only preview adapter was introduced for this slice.

## 4. What Was Implemented by Slice

### Slice A. Navigation and IA alignment

Implemented:

- removed top-level `AI-верстка` from admin nav;
- kept `Страницы` as the single user-visible domain entry;
- moved all residual `buildLandingWorkspaceHref()` calls onto Pages-domain URLs;
- converted legacy workspace pages into compatibility redirects.

Code zones:

- `lib/admin/nav.js`
- `components/admin/AdminShell.js`
- `lib/admin/landing-workspace.js`
- `app/admin/(console)/workspace/landing/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`

Outcome:

- no top-level peer workflow survives in the main admin IA;
- deep links keep working through redirects.

### Slice B. Registry screen refactor

Implemented:

- `Страницы` registry now renders through a dedicated cards-first client surface;
- search and filters are available;
- list mode remains available as a secondary representation;
- cards are minimal:
  - title,
  - preview,
  - status,
  - three-dots menu;
- metadata modal opens directly from the registry card menu.

Code zones:

- `app/admin/(console)/entities/[entityType]/page.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageRegistryClient.module.css`
- `components/admin/PageMetadataModal.js`
- `components/admin/PageMetadataModal.module.css`
- `lib/admin/page-workspace.js`

Outcome:

- first entry into Pages is now overview-first and light;
- metadata is no longer a competing top-level editing surface.

### Slice C. Unified page workspace shell

Implemented:

- `/admin/entities/page/[pageId]` now renders a page-specific workspace instead of a generic editor + AI CTA;
- shell is split into:
  - launcher rail,
  - canvas,
  - pinned AI panel;
- no peer-screen hop is required for page composition work.

Code zones:

- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageWorkspaceScreen.module.css`

Outcome:

- page editing is unified in one canonical screen;
- old “open AI layout” action is gone.

### Slice D. Metadata management layer

Implemented:

- movable tabbed metadata modal;
- opens from registry cards and from the page workspace;
- separate save path for metadata;
- metadata save merges server-side composition state before saving;
- composition save merges server-side metadata state before saving.

Code zones:

- `components/admin/PageMetadataModal.js`
- `components/admin/PageMetadataModal.module.css`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`
- `lib/admin/page-workspace.js`

Outcome:

- hidden metadata carry-through is cut;
- stale overwrite risk is reduced materially.

### Slice E. Source launchers and specialized pickers

Implemented:

- left rail is now a launcher rail, not a scrolling warehouse;
- first launcher families:
  - `Медиа`
  - `Кейсы`
  - `Услуги`
- launchers open specialized pickers/modals;
- pickers return only page-owned refs and ordering, not a second truth artifact.

Code zones:

- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageWorkspaceScreen.module.css`

Outcome:

- source-selection UX is lighter and domain-bounded.

### Slice F. Composition and connective copy

Implemented:

- page-owned canvas sections for:
  - hero,
  - selected sources,
  - connective copy,
  - CTA/contact block;
- connective copy remains part of page composition state;
- ordering controls are bounded to selected refs already owned by `Page`.

Code zones:

- `components/admin/PageWorkspaceScreen.js`
- `lib/admin/page-workspace.js`

Outcome:

- connective copy is integrated without inventing a detached entity.

### Slice G. AI panel integration

Implemented:

- AI panel is embedded on the right side of the page workspace;
- allowed first-slice actions are narrow:
  - rewrite selected block,
  - suggest connective copy,
  - strengthen CTA,
  - compact wording;
- AI returns bounded patch suggestions only;
- explicit user apply is required before page save;
- route/type/SEO/publish ownership fields are outside AI patch scope.

Code zones:

- `components/admin/PageWorkspaceScreen.js`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`
- `lib/admin/page-workspace.js`

Outcome:

- AI is useful without becoming a pseudo-editor or second owner.

### Slice H. Preview unification

Implemented:

- page workspace preview uses canonical `StandalonePage`;
- preview lookup resolvers are built from published lookup maps;
- no workspace-only preview renderer remains in the new page workflow.

Code zones:

- `components/admin/PageWorkspaceScreen.js`
- `lib/admin/page-workspace.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`

Outcome:

- preview semantics now align materially with review/public rendering.

### Slice I. Legacy decommission

Implemented:

- top-level nav access to `AI-верстка` removed;
- legacy workspace pages turned into redirects;
- legacy landing workspace API route deprecated from save behavior;
- duplicate write-path removed from active workflow;
- old route helper now points into Pages domain.

Code zones:

- `lib/admin/nav.js`
- `components/admin/AdminShell.js`
- `app/admin/(console)/workspace/landing/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
- `app/api/admin/workspace/landing/[pageId]/route.js`
- `lib/admin/landing-workspace.js`

Outcome:

- legacy entry points no longer own page editing semantics.

## 5. Code Zones Changed

Primary code changes:

- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/workspace/landing/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`
- `app/api/admin/workspace/landing/[pageId]/route.js`
- `components/admin/AdminShell.js`
- `components/admin/PageMetadataModal.js`
- `components/admin/PageMetadataModal.module.css`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageRegistryClient.module.css`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageWorkspaceScreen.module.css`
- `lib/admin/landing-workspace.js`
- `lib/admin/nav.js`
- `lib/admin/page-workspace.js`
- `tests/admin-shell.test.js`
- `tests/landing-workspace.route.test.js`
- `tests/page-workspace.route.test.js`

## 6. Routes and Navigation Changes

Canonical routes:

- registry: `/admin/entities/page`
- workspace: `/admin/entities/page/[pageId]`

Compatibility routes:

- `/admin/workspace/landing` -> redirect to `/admin/entities/page`
- `/admin/workspace/landing/[pageId]` -> redirect to `/admin/entities/page/[pageId]`

Deprecated API:

- `/api/admin/workspace/landing/[pageId]`
  - no longer saves anything;
  - redirects back with an explicit deprecation error.

## 7. Save-Path Convergence Notes

New canonical route:

- `/api/admin/entities/page/[pageId]/workspace`

Supported actions:

- `save_composition`
- `save_metadata`
- `send_to_review`
- `suggest_patch`

Convergence rules implemented:

- composition save preserves canonical metadata by reloading base metadata server-side;
- metadata save preserves canonical composition by reloading base composition server-side;
- AI does not save;
- review handoff uses the canonical current draft revision only;
- old landing workspace POST route no longer writes to `Page`.

This is the main ownership seam that was intentionally cut early.

## 8. Metadata-Layer Notes

Implemented metadata surface characteristics:

- tabbed
- movable
- page-owned
- accessible from registry and workspace
- explicit save

Fields moved into metadata:

- route fields
- type fields
- theme key
- SEO fields

Fields intentionally left on the canvas:

- visible copy
- connective copy
- CTA/contact copy
- selected refs and order

## 9. Source Launcher / Picker Notes

The left rail intentionally does not keep a scrollable warehouse list.

Instead:

- each family is a launcher;
- each launcher opens a dedicated modal;
- modal output is a bounded set of ids owned by `Page`.

No new domain entity was added for source selection.

## 10. Connective-Copy Implementation Notes

Connective copy was implemented as page-owned composition state, not as a reusable foreign entity.

Current mapping:

- `body` is used as the main connective text between proof/source blocks and final conversion intent;
- `contactNote` remains page-owned for contacts pages.

This stays inside the existing bounded page payload contract and avoids a new truth artifact.

## 11. AI Panel Implementation Notes

Boundaries enforced:

- AI can only propose bounded copy patches;
- AI cannot mutate route ownership fields;
- AI cannot mutate metadata silently;
- AI cannot publish;
- AI cannot bypass review/history flow.

Implementation posture:

- request -> bounded suggestion
- operator apply -> local state only
- explicit save -> canonical draft write

## 12. Preview Unification Notes

Page workspace preview now uses:

- canonical page payload normalization,
- published lookup maps,
- canonical `StandalonePage` renderer.

This removes the previous split where workspace preview lived in a separate representation layer.

## 13. Legacy Decommission Notes

Removed from primary workflow:

- top-level `AI-верстка` nav narrative;
- page detail CTA into a peer AI workspace;
- active peer write-path via legacy landing workspace POST route.

Kept temporarily as compatibility stubs:

- legacy `/admin/workspace/landing`
- legacy `/admin/workspace/landing/[pageId]`
- legacy route helper name `buildLandingWorkspaceHref()`

Left in codebase but no longer primary:

- old landing workspace-specific UI/component modules that are no longer routed by the main user workflow.

These remaining modules are cleanup candidates, not active workflow owners.

## 14. Tests / Checks Run

Executed successfully:

- `npm test`
- `npm run build`

Result:

- tests green
- build green

Residual build note:

- Turbopack still reports an existing NFT tracing warning through `next.config.mjs -> lib/config.js -> app/api/media/[entityId]/route.js`.
- This warning predates the new page workflow slice and was not expanded by the final build result.

## 15. Risks Found During Execution

### Risk: server-only dependencies leaking into the client workspace

Severity: High

Found during:

- initial build verification

Mitigation applied:

- rewrote `lib/admin/page-workspace.js` to remove dependencies on server-side workspace/DB helpers;
- kept the client-consumed helper module pure.

### Risk: review action looked available for published-only pages with no draft

Severity: Medium

Mitigation applied:

- workspace now initializes review action state only from the actual draft revision, not from any working revision.

### Risk: picker state becoming stale across modal reopen

Severity: Medium

Mitigation applied:

- launcher picker local state is resynced on open.

## 16. What Was Deferred and Why

Deferred intentionally:

- hard deletion of legacy landing workspace component modules that are no longer routed.
  - Reason: not needed for canonical workflow cutover; safer as a follow-up cleanup slice.
- broader visual/design polish of the new page workspace.
  - Reason: epic goal was workflow ownership and contract convergence first.
- new dedicated create-page flow inside the cards-first registry.
  - Reason: existing `/admin/entities/page/new` path still works and does not reintroduce dual-screen ownership drift.
- device-switching preview controls inside the new page workspace.
  - Reason: canonical renderer convergence was the hard requirement; viewport tooling can be added as a follow-up enhancement.

## 17. Remaining Open Questions

- Whether the existing `/admin/entities/page/new` creation flow should be reworked into a registry-native lightweight create entry in the next UX slice.
- Whether metadata modal should expose theme selection with richer previews, or stay text-only for now.
- Whether the next cleanup slice should delete unused landing-workspace UI modules entirely or keep them through one more release cycle.
- Whether the workspace preview should adopt the same viewport switcher used in review detail for stronger operator parity.

## 18. Recommended Next Epics

1. Cleanup epic for dead legacy landing-workspace modules and names.
2. Registry-native page creation UX refinement.
3. Preview parity enhancement with device viewport controls in the page workspace.
4. Additional bounded AI actions only if they preserve current patch-only semantics.
5. Small polish pass on page registry filters:
   - add `missing` and `inactive` filter values,
   - surface last updated metadata if needed.
