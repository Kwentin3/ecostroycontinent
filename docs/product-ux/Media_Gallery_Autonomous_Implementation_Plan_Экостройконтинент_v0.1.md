# Media Gallery Autonomous Implementation Plan

Статус: autonomous implementation plan v0.1
Назначение: канонический execution document для фичи “экран медиа-галереи”.
Опорные артефакты:
- `docs/ЭКРАН МЕДИА-ГАЛЕРЕИ.PRD v3.md`
- `docs/reports/2026-03-27/eco.media-gallery-prd-landscape-intake.v1.report.md`
- `docs/product-ux/Media_Gallery_PRD_Hardening_Addendum_Экостройконтинент_v0.1.md`
- `docs/product-ux/Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/EKOSTROY.UI.VERSTKA_PENDING_CARRYOVERS_PLAN_Экостройконтинент_v0.1.md`

## 1. Executive summary

**FACT** Этот эпик не стартует из пустоты. Для него уже существуют:
- PRD с прибитой gallery-first моделью;
- landscape intake report с code/contract fit-анализом;
- hardening addendum с минимальными prerequisite decisions;
- канон по shell/navigation/domain/storage boundaries.

**DECISION ALREADY FIXED** Будущий execution не должен переоткрывать:
- `MediaAsset` vs `Gallery` split;
- image-only V1 boundary;
- admin write-side posture;
- metadata truth vs binary truth;
- right rail as support/inspector, not main editor;
- no generic SEO fields on `media_asset` without real contract;
- no silent overwrite for published assets.

**PREREQUISITE** До начала основной автономной реализации должны быть закрыты blocker-level решения:
- upload lifecycle for overlay-first create flow;
- draft reuse policy;
- variant scope decision;
- card status truth mapping;
- broken asset semantics scope.

**RISK** Без этих решений агент почти наверняка начнёт импровизировать contract/state behavior, а не просто реализовывать PRD.

**Execution posture**
- сначала contract/query truth;
- потом workspace shell and grid;
- потом inspector/edit/upload behavior;
- optional image-edit/variant band only if still in scope;
- потом keyboard/accessibility, QA and docs sync.

## 2. Implementation readiness snapshot

### Ready now

**FACT** Уже достаточно прибито для начала planning decomposition:
- one working place / gallery-first browse model;
- inspector-right, editor-overlay split;
- narrow media metadata V1 contract;
- image-only scope;
- no generic SEO leakage on `media_asset`;
- find-me-after-save is a required outcome;
- archive/delete must remain safety-first;
- shell canon is fixed and must be respected.

### Ready after minimal hardening

**PREREQUISITE** Следующие точки должны быть явно зафиксированы до запуска core implementation bands:
- upload lifecycle choice;
- draft reuse policy;
- variant scope decision;
- card status vocabulary mapping from existing truth;
- broken asset signal boundary.

### Not ready until resolved

**BLOCKER** Эти зоны нельзя оставлять на усмотрение реализации:
- “как именно существует несохранённый upload state”;
- “что такое derived variant в persisted model”;
- “что считается usage truth for blocking rules”;
- “что именно означает broken in V1”.

## 3. Confirmed prerequisites

### 3.1 Product and domain prerequisites already confirmed

**DECISION ALREADY FIXED**
- `media_asset` and `gallery` stay separate entities.
- V1 stays image-only.
- `media_asset` V1 editable metadata is limited to `title`, `alt`, `caption`, `sourceNote`, `ownershipNote`.
- Generic shared-form SEO fields must not be exposed as real editable media fields.
- Right rail remains support/status/inspector only.
- Large editing happens in overlay, not in right rail.
- Published overwrite remains forbidden.

### 3.2 Architecture prerequisites already confirmed

**FACT**
- Binary storage lives behind `lib/media/storage.js`.
- Metadata truth lives in content revisions / SQL.
- Public delivery and admin preview are separate paths.
- Current routes and content-core services already provide a real media domain foundation.

### 3.3 Project posture prerequisites already confirmed

**DECISION ALREADY FIXED**
- This is not a DAM-platform rewrite.
- This is not a new workflow engine.
- This is not a redesign of the whole admin shell.
- This is not a route-ownership rewrite unless explicitly reviewed.

## 4. Unresolved prerequisites / blocker decisions

### 4.1 Upload lifecycle choice

**BLOCKER** One technical lifecycle must be approved before implementation of create/upload bands:
- in-browser temporary state;
- temporary persisted draft;
- upload-finalize flow.

**Why blocker**
- It changes API shape, state handling, cleanup semantics, and error recovery.
- Downstream overlay and find-me-after-save behavior depend on it.

### 4.2 Draft reuse policy

**BLOCKER** One policy must be approved:
- freshly uploaded draft assets are reusable immediately in editorial flows;
- or reuse remains published-only until separate contract change.

**Why blocker**
- It changes query layer, picker behavior, and actual operator value of the new screen.

### 4.3 Variant scope decision

**BLOCKER** One decision must be approved:
- derived variant is deferred to V1.1/V2;
- or variant stays in V1 with explicit minimal lineage-safe contract.

**Why blocker**
- Current system has no variant lineage contract.
- Without this, image editing and overwrite safety can drift fast.

### 4.4 Card status truth mapping

**PREREQUISITE** Badge/status wording on cards must be explicitly mapped from current truth.

**Why prerequisite**
- Current system has both revision state and payload status.
- V1 is not allowed to invent a third hidden state machine.

### 4.5 Broken asset semantics scope

**PREREQUISITE** V1 must explicitly choose one of these two honest approaches:
- differentiate storage/admin-preview failure from public/CDN failure;
- or scope V1 broken signal only to one of these classes.

**Why prerequisite**
- Otherwise card signals will be misleading during infra degradation.

## 5. Canonical execution chain

**Execution order**
1. Prerequisite closure and execution freeze.
2. Domain/contract hygiene for media V1.
3. Query/search/filter/usage aggregation layer.
4. Workspace shell transition and dedicated media surface scaffolding.
5. Gallery grid/cards and selection/inspector behavior.
6. Metadata edit overlay and find-me-after-save.
7. Upload flow implementation against approved lifecycle.
8. Optional image-edit / variant band only if still in approved V1 scope.
9. Archive/delete safety behavior.
10. Keyboard/accessibility behavior.
11. QA, proof package, and docs sync.

**FACT** The chain is intentionally backend-first where truth is missing, and UI-first only where the system already has honest contracts.

**AUTONOMOUS DISCRETION FORBIDDEN**
- skipping prerequisite closure and “deciding in code”; 
- building card/usage/broken signals before truthful data sources exist;
- implementing overlay-first upload on top of an unapproved lifecycle;
- sneaking variants back into scope without approved lineage semantics.

## 6. Execution bands

### Band 0. Prerequisite closure and execution freeze

**OBJECTIVE**
Close the remaining blocker decisions and translate them into explicit execution assumptions.

**SCOPE**
- upload lifecycle choice;
- draft reuse policy;
- variant scope decision;
- card status mapping note;
- broken asset scope note.

**PREREQUISITES**
- current PRD;
- intake report;
- hardening addendum.

**ALLOWED CHANGES**
- PRD addendum or implementation kickoff note;
- compact decision table;
- explicit scope/defer note.

**FORBIDDEN SHORTCUTS**
- “we will pick the easiest implementation later”;
- silent assumption of current direct upload path as final model;
- treating variants as “nice to have, maybe inside the same editor anyway”.

**PROOF PACKAGE**
- written decision note covering all five prerequisites;
- explicit yes/no/defer outcomes;
- no blocker remains implicit.

**STOP TRIGGERS**
- owner decision unavailable;
- contradiction between addendum and chosen path;
- any prerequisite left as “open thought”.

**DOWNSTREAM UNLOCK**
- unlocks Bands 1–3;
- Band 7 cannot start without upload lifecycle choice;
- Band 8 cannot start without variant scope decision.

**OWNER REVIEW REQUIRED**
- yes, this band is the last product/contract freeze checkpoint.

### Band 1. Media V1 contract and DTO hygiene

**OBJECTIVE**
Align current code/contracts with the already fixed V1 honesty rules before building the new UI.

**SCOPE**
- remove generic SEO leakage from `media_asset` editing path/UI exposure;
- make image-only boundary explicit in relevant UI/data paths;
- formalize card-status derivation note in code-facing DTO comments or adapter layer;
- define the data shape that the new media workspace is allowed to consume.

**PREREQUISITES**
- Band 0 complete.

**ALLOWED CHANGES**
- media-specific view model / adapter layer;
- shared form extraction or narrowing for media;
- DTO comments and internal contracts;
- tests proving media save path does not pretend to persist unsupported fields.

**FORBIDDEN SHORTCUTS**
- reusing generic shared form blocks that still expose unsupported fields;
- adding new persisted fields just to make UI easier;
- creating a parallel status enum without approved contract.

**PROOF PACKAGE**
- code proof that `media_asset` edit surface exposes only supported V1 fields;
- tests or assertions for DTO shape;
- screenshots showing media no longer exposes dishonest SEO fields.

**STOP TRIGGERS**
- need for new persisted contract not approved in Band 0;
- discovery that gallery/media split cannot be preserved with current DTO assumptions;
- pressure to keep unsupported SEO fields “temporarily visible”.

**DOWNSTREAM UNLOCK**
- unlocks media workspace UI bands with an honest data contract.

**AUTONOMOUS DISCRETION ALLOWED**
- narrow refactor of shared editor code to isolate media-specific surface.

**AUTONOMOUS DISCRETION FORBIDDEN**
- schema expansion without approval.

### Band 2. Library query, filter, and usage aggregation layer

**OBJECTIVE**
Build the backend/query truth that the gallery-first surface depends on.

**SCOPE**
- dedicated media library query DTO for grid cards;
- search by approved V1 metadata fields;
- quick filter buckets;
- sort modes;
- used/unused, usage count, usage summary;
- archive/delete safety dependency checks;
- card status/broken signal derivation from approved truth.

**PREREQUISITES**
- Band 0 decisions fixed;
- Band 1 DTO hygiene complete.

**ALLOWED CHANGES**
- new service/query functions;
- repository/query extensions;
- explicit aggregation layer for reverse references;
- backend-only DTOs for workspace grid and inspector.

**FORBIDDEN SHORTCUTS**
- client-only heuristics for usage;
- placeholder string labels instead of aggregated truth;
- published-only assumptions if Band 0 says draft reuse is allowed;
- deriving broken signal from one random fetch path.

**PROOF PACKAGE**
- query contract examples for grid cards and inspector data;
- tests for search/filter/sort behavior;
- tests for usage count and blocking eligibility;
- documented mapping for card status and broken signals.

**STOP TRIGGERS**
- approved draft reuse policy missing;
- reverse reference computation cannot be done honestly from current model without additional contract work;
- performance characteristics make the selected query pattern dishonest for expected dataset size.

**DOWNSTREAM UNLOCK**
- unlocks Bands 3–6 and Band 9;
- all gallery UI bands depend on this truth layer.

**OWNER REVIEW REQUIRED**
- only if usage aggregation reveals a contract gap larger than expected.

### Band 3. Dedicated media workspace shell transition

**OBJECTIVE**
Replace the generic media list/detail posture with a dedicated gallery-workspace scaffold while preserving admin shell canon.

**SCOPE**
- dedicated media workspace component tree;
- toolbar area;
- grid area host;
- inspector host;
- overlay host;
- empty/loading/error/no-access states;
- route continuity under existing admin namespace unless separately reviewed.

**PREREQUISITES**
- Band 1 and Band 2 complete.

**ALLOWED CHANGES**
- dedicated route rendering for `media_asset` list surface;
- media-specific page composition under existing shell;
- local client state scaffold for selection/overlay shell.

**FORBIDDEN SHORTCUTS**
- creating a second competing media truth screen;
- turning sidebar into media tree navigation;
- turning right rail into a large editor;
- collapsing `gallery` semantics into the workspace shell.

**PROOF PACKAGE**
- screenshot matrix for empty/loading/populated workspace;
- shell proof showing sidebar/breadcrumb/right-rail canon preserved;
- route map showing no accidental ownership drift.

**STOP TRIGGERS**
- shell canon conflict;
- route ownership rewrite required unexpectedly;
- inability to host inspector and overlay without breaking global shell behavior.

**DOWNSTREAM UNLOCK**
- unlocks card/grid, inspector, overlay, and upload UI bands.

**AUTONOMOUS DISCRETION ALLOWED**
- bounded workspace composition choices inside the current shell.

### Band 4. Gallery grid, toolbar, filters, and selection behavior

**OBJECTIVE**
Implement the gallery-first browse surface and stable selection model.

**SCOPE**
- grid cards;
- toolbar search;
- sort control;
- quick filters;
- selection state;
- inspector open/close behavior;
- selected-card persistence across non-destructive actions.

**PREREQUISITES**
- Band 2 query/usage DTOs;
- Band 3 workspace scaffold.

**ALLOWED CHANGES**
- client state for selected asset;
- card component library for media workspace;
- grid layout and empty/filter states;
- bounded client-side refinements if consistent with approved query truth.

**FORBIDDEN SHORTCUTS**
- table-first fallback presented as gallery done;
- fake badges unsupported by Band 2 truth;
- hidden selection resets after every interaction;
- overloading cards with full metadata form content.

**PROOF PACKAGE**
- UI proof for search/filter/sort/select;
- screenshots with each mandatory card signal;
- behavior proof that selected state is stable and predictable.

**STOP TRIGGERS**
- grid architecture cannot support required keyboard behavior without redesign;
- selected-state behavior conflicts with current route/state model more than expected;
- query truth insufficient for required card signals.

**DOWNSTREAM UNLOCK**
- unlocks inspector and metadata overlay bands.

### Band 5. Inspector panel and safety-context behavior

**OBJECTIVE**
Implement a compact inspector that gives context, warnings, usage, and one primary edit action without becoming the editor itself.

**SCOPE**
- larger preview;
- title/original filename;
- mime/size;
- alt presence warning;
- source/ownership hints;
- used/unused and usage summary;
- broken/degraded signal;
- one primary `Редактировать` action;
- archive/delete safety explanation if action is blocked.

**PREREQUISITES**
- Band 2 usage and status truth;
- Band 4 selection behavior.

**ALLOWED CHANGES**
- compact inspector UI;
- quick warnings and derived labels;
- action gating based on usage/safety truth.

**FORBIDDEN SHORTCUTS**
- editing metadata directly in inspector;
- multiple competing primary actions in inspector;
- archive/delete affordances without truthful blocking logic.

**PROOF PACKAGE**
- populated inspector screenshots;
- used vs unused and blocked-action proofs;
- degraded/broken signal proofs with honest labels.

**STOP TRIGGERS**
- usage summary cannot be rendered honestly from Band 2 layer;
- right rail starts accumulating real editor responsibilities;
- broken signal semantics unresolved.

**DOWNSTREAM UNLOCK**
- unlocks edit overlay band and safety-action band.

### Band 6. Metadata edit overlay and find-me-after-save

**OBJECTIVE**
Create the real editor experience for existing assets inside the workspace.

**SCOPE**
- overlay shell;
- large preview;
- V1 metadata fields only (`title`, `alt`, `caption`, `sourceNote`, `ownershipNote`);
- save/cancel behavior;
- error retention inside overlay;
- existing asset update flow;
- find-me-after-save behavior for updated and newly created assets where applicable.

**PREREQUISITES**
- Band 1 contract hygiene;
- Band 3 workspace shell;
- Band 4 selection model.

**ALLOWED CHANGES**
- dedicated media overlay component;
- media-specific form logic;
- outcome-based find-me-after-save implementation.

**FORBIDDEN SHORTCUTS**
- full-page fallback to generic entity detail as the normal edit path;
- reintroducing generic SEO fields;
- dropping entered metadata on save/upload error;
- making find-me-after-save depend on one brittle sorting assumption.

**PROOF PACKAGE**
- screenshots/video proof for edit existing asset;
- proof that only honest media fields are editable;
- proof that after save user remains oriented to the same asset.

**STOP TRIGGERS**
- overlay cannot preserve error/input state with chosen architecture;
- save path requires contract changes outside approved scope;
- current route/state model forces hard navigation for normal edits.

**DOWNSTREAM UNLOCK**
- unlocks create/upload overlay band and accessibility band.

### Band 7. Upload flow implementation against approved lifecycle

**OBJECTIVE**
Implement the create-new flow so upload lands in overlay-first finish-first behavior instead of today’s generic upload-first redirect model.

**SCOPE**
- primary `Загрузить` CTA;
- optional drag-and-drop only if still approved and low-risk;
- temporary/pre-final state according to approved lifecycle;
- preview before final save when lifecycle allows;
- metadata completion before asset becomes a normal gallery object;
- explicit failure handling without silent ghost records;
- selection/find-me after successful creation.

**PREREQUISITES**
- Band 0 upload lifecycle approved;
- Band 6 overlay ready;
- storage/runtime path healthy enough for upload verification.

**ALLOWED CHANGES**
- upload endpoint changes consistent with approved lifecycle;
- temporary upload state management;
- cleanup of failed or abandoned temp state if lifecycle requires it.

**FORBIDDEN SHORTCUTS**
- treating current direct upload redirect as good enough if it breaks the approved UX outcome;
- leaving half-created assets visible as normal library objects;
- losing typed metadata on transient upload/save errors.

**PROOF PACKAGE**
- success flow proof from upload to visible selected asset;
- failure flow proof for storage/upload error;
- proof that temporary/failed state does not pollute the main library;
- live verification against real storage runtime.

**STOP TRIGGERS**
- upload lifecycle still unresolved;
- chosen lifecycle cannot guarantee no ghost assets without new contract work;
- storage/runtime behavior contradicts assumed failure model.

**DOWNSTREAM UNLOCK**
- unlocks complete V1 create flow;
- unlocks optional image-edit/variant band if still in scope.

**OWNER REVIEW REQUIRED**
- only if actual lifecycle implementation reveals a materially different persistence model than approved.

### Band 8. Image editing and variants (conditional band)

**OBJECTIVE**
Handle minimal image editing in a way that does not break overwrite safety or scope discipline.

**SCOPE**
Two allowed modes:
1. **Variant deferred mode**
   - integrate no variant behavior in V1;
   - keep image editing limited or defer it if it cannot be lineage-safe.
2. **Variant approved mode**
   - integrate minimal image edit actions;
   - create derived variant as new `media_asset` only;
   - preserve published overwrite ban.

**PREREQUISITES**
- Band 0 variant scope decision approved;
- if approved in V1, minimal lineage contract approved;
- Band 6 overlay ready.

**ALLOWED CHANGES**
- minimal image editor integration;
- explicit derived-variant creation flow if approved;
- defer/hide affordance if variants are out of V1.

**FORBIDDEN SHORTCUTS**
- silent overwrite of published assets;
- pseudo-variant behavior with no persisted lineage meaning;
- ballooning image editor into mini-DAM subproduct.

**PROOF PACKAGE**
- if deferred: proof that UI does not promise unavailable behavior;
- if implemented: proof of draft-only overwrite or lineage-safe variant creation;
- screenshots and behavioral acceptance for approved actions only.

**STOP TRIGGERS**
- lineage semantics unresolved;
- image editor library forces broader scope than approved;
- replacement behavior would affect live references without truthful safety handling.

**DOWNSTREAM UNLOCK**
- unlocks full V1 closure only if variants remain in scope.

### Band 9. Archive/delete safety actions

**OBJECTIVE**
Implement the safety posture for archive/delete/withdraw without dangerous simplification.

**SCOPE**
- action availability rules based on usage truth;
- blocked-state explanations;
- bounded archive/withdraw UI if still in V1 scope;
- no hard-delete-by-default behavior.

**PREREQUISITES**
- Band 2 usage aggregation truth;
- Band 5 inspector safety context;
- explicit product scope on which safety actions exist in V1.

**ALLOWED CHANGES**
- action gating;
- user-facing explanation copy;
- internal service calls consistent with existing content lifecycle posture.

**FORBIDDEN SHORTCUTS**
- enabling destructive action because “admin should know what they are doing”;
- archive/delete logic based only on published usage if rule says any usage blocks;
- physically deleting media by default.

**PROOF PACKAGE**
- blocked action proofs for used assets;
- allowed action proof for unused eligible assets if such path exists;
- audit/history proof if action writes lifecycle events.

**STOP TRIGGERS**
- usage truth cannot support blocking rule honestly;
- archive/delete semantics require broader content lifecycle change.

**DOWNSTREAM UNLOCK**
- unlocks final operator safety acceptance.

### Band 10. Keyboard/accessibility behavior

**OBJECTIVE**
Implement V1 keyboard and accessibility behavior as part of the contract, not as post-polish.

**SCOPE**
- visible focus;
- entry into gallery grid;
- arrow-key grid navigation;
- Enter/Space selection behavior;
- Escape stack behavior for overlay then inspector;
- overlay focus management;
- accessible labels for grid cards, inspector actions, and form fields.

**PREREQUISITES**
- Band 4 grid;
- Band 5 inspector;
- Band 6 overlay.

**ALLOWED CHANGES**
- roving tabindex or equivalent navigation model;
- explicit focus management utilities;
- minor component refactors required for accessible behavior.

**FORBIDDEN SHORTCUTS**
- leaving grid mouse-only;
- deferring Escape behavior as “later polish”;
- inaccessible overlay focus flow.

**PROOF PACKAGE**
- keyboard walkthrough checklist;
- Playwright or equivalent behavior proof for key flows;
- accessibility-focused screenshots or QA notes.

**STOP TRIGGERS**
- current grid implementation cannot support required keyboard model without architecture change;
- overlay/focus management collides with route or shell assumptions.

**DOWNSTREAM UNLOCK**
- unlocks final QA closure.

### Band 11. QA, proof package, runtime verification, and docs sync

**OBJECTIVE**
Close the epic with honest verification and synced documentation.

**SCOPE**
- route-by-route media workspace QA;
- runtime upload verification against real storage;
- broken/degraded signal verification under real infra conditions where possible;
- docs updates;
- cleanup of probe/test data if it pollutes proof evaluation;
- final acceptance matrix.

**PREREQUISITES**
- all in-scope feature bands complete.

**ALLOWED CHANGES**
- tests;
- Playwright verification;
- docs updates;
- bounded cleanup via internal cleanup tool where needed for truthful proof.

**FORBIDDEN SHORTCUTS**
- marking the epic done without live storage verification;
- using probe-cluttered UI as final proof without disclosure;
- leaving PRD/addendum/docs stale after behavior changes.

**PROOF PACKAGE**
- screenshot matrix for empty, loading, populated, broken/degraded, upload-success, upload-error, inspector, overlay, keyboard flows;
- storage/runtime verification note;
- docs sync note;
- residual risks list.

**STOP TRIGGERS**
- unresolved blocker from earlier bands remains open;
- runtime cannot support truthful verification;
- CDN degradation makes broken-signal proof ambiguous without documented caveat.

**DOWNSTREAM UNLOCK**
- epic closure.

## 7. Review gates

### Gate 0. Prerequisite freeze

**OBJECTIVE**
Approve blocker decisions from Band 0.

**Unlocks**
- all core execution bands.

### Gate 1. Contract/query truth gate

**OBJECTIVE**
Review Band 1 + Band 2 together.

**Why grouped**
- this is the first point where the system has honest media DTOs, honest usage truth, and truthful status/broken semantics.

**Unlocks**
- workspace UI bands can proceed without product guessing.

### Gate 2. Workspace behavior gate

**OBJECTIVE**
Review Band 3 + Band 4 + Band 5 together.

**Why grouped**
- after this gate, the main gallery-first surface exists as a truthful browse/select/inspect workspace.

**Unlocks**
- overlay editing and upload implementation.

### Gate 3. Edit/upload gate

**OBJECTIVE**
Review Band 6 + Band 7 together.

**Why grouped**
- this is the point where the operator’s primary workflow is real end-to-end.

**Unlocks**
- optional image-edit/variant work and final QA.

### Gate 4. Variant gate (conditional)

**OBJECTIVE**
Only needed if variants remain in V1.

**Unlocks**
- full scope completion including image-edit/variant functionality.

### Gate 5. Final closure gate

**OBJECTIVE**
Review Band 9 + Band 10 + Band 11 proof package.

**Unlocks**
- epic close / delivery readiness.

## 8. Layer-violation audit notes

### Media vs Gallery domain split

**DECISION ALREADY FIXED** `media_asset` and `gallery` remain distinct.

**STOP TRIGGER**
- any implementation that hides `gallery` semantics inside ad hoc card grouping without preserving the entity boundary.

### Metadata truth vs binary truth

**FACT** Metadata stays in SQL/content revisions; binary stays in storage.

**STOP TRIGGER**
- UI or state logic that begins treating CDN URL or preview URL as metadata truth.

### Inspector vs editor responsibilities

**DECISION ALREADY FIXED** Inspector is compact context only; editing happens in overlay.

**STOP TRIGGER**
- right rail starts accumulating form fields or image-edit responsibilities.

### Write-side vs read-side posture

**FACT** Admin is write-side content ops, not public gallery delivery.

**STOP TRIGGER**
- implementation starts modeling the gallery as a public-media browser instead of editorial workspace.

### Revision/publish/storage truth

**FACT** Revision truth and publish truth already exist and must not be bypassed.

**STOP TRIGGER**
- implementation introduces silent overwrite or direct destructive mutation that bypasses revision/history expectations.

### Honest contract exposure

**DECISION ALREADY FIXED** Unsupported fields must not be shown as editable truth.

**STOP TRIGGER**
- generic SEO fields or unsupported variant fields appear on `media_asset` UI without contract backing.

## 9. Risks to autonomous execution

**RISK 1** Upload lifecycle drift.
- Most dangerous because it affects API, UI, storage, cleanup, and create-flow behavior simultaneously.

**RISK 2** Usage visibility fakery.
- Easy to ship visually, hard to ship honestly.

**RISK 3** Status inflation.
- Card UX will tempt an agent to invent badge vocabulary beyond current truth.

**RISK 4** Variant creep.
- Minimal image editing can quickly become a semi-product if boundaries are not enforced.

**RISK 5** Shared editor leakage.
- Existing generic entity infrastructure may reintroduce dishonest fields or full-page patterns unless explicitly fenced.

**RISK 6** Infra-path confusion.
- Admin preview, storage health, and CDN health are separate. Broken-state UX must not collapse them casually.

**RISK 7** Probe/test data distortion.
- Live proof can be misleading if test assets clutter the library or infrastructure is temporarily degraded.

## 10. Recommended owner-review checkpoints

1. **Prerequisite freeze checkpoint**
   - upload lifecycle
   - draft reuse policy
   - variant scope
   - card status mapping
   - broken signal scope

2. **Contract/query checkpoint**
   - approve usage aggregation truth and card DTO semantics if they expose surprising model gaps.

3. **Workspace behavior checkpoint**
   - confirm the gallery/inspector/overlay split still feels faithful to PRD and shell canon.

4. **Upload flow checkpoint**
   - confirm create flow matches approved lifecycle and does not leave ghost assets.

5. **Variant checkpoint**
   - only if variants stay in V1.

6. **Final closure checkpoint**
   - accept final proof package and residual-risk note.

## 11. Closure criteria for the epic

The epic is closed only when all of the following are true:

**FACT / PROOF REQUIRED**
- media workspace is gallery-first, not table-first;
- inspector is compact support context, not a hidden second editor;
- overlay is the primary edit surface for media metadata;
- only honest V1 media fields are editable;
- upload/create flow follows the approved lifecycle and does not leak ghost assets;
- find-me-after-save works for the create/update flows in scope;
- used/unused and usage blocking are driven by explicit aggregation truth;
- archive/delete safety behavior matches the approved rule set;
- keyboard/accessibility behavior is implemented as required, not deferred;
- no shell canon violation is introduced;
- no media/gallery domain collapse is introduced;
- docs and proof artifacts are updated;
- residual risks are documented honestly.

## 12. Appendix

### 12.1 Likely affected files / modules / contracts / screens / services

#### Docs that anchor execution
- `docs/ЭКРАН МЕДИА-ГАЛЕРЕИ.PRD v3.md`
- `docs/reports/2026-03-27/eco.media-gallery-prd-landscape-intake.v1.report.md`
- `docs/product-ux/Media_Gallery_PRD_Hardening_Addendum_Экостройконтинент_v0.1.md`
- `docs/product-ux/Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/EKOSTROY.UI.VERSTKA_PENDING_CARRYOVERS_PLAN_Экостройконтинент_v0.1.md`

#### Current media/gallery/admin code
- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/MediaPicker.js`
- `components/admin/AdminShell.js`
- `components/admin/admin-ui.module.css`
- `lib/admin/entity-ui.js`
- `lib/admin/screen-copy.js`
- `lib/admin/infra-health.js`

#### Domain/model/query/storage code
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/content-core/repository.js`
- `lib/content-core/service.js`
- `lib/content-core/content-types.js`
- `lib/content-ops/readiness.js`
- `lib/media/storage.js`
- `lib/read-side/public-content.js`
- `lib/config.js`

#### API / delivery endpoints
- `app/api/admin/media/upload/route.js`
- `app/api/admin/media/[entityId]/preview/route.js`
- `app/api/admin/entities/[entityType]/save/route.js`
- `app/api/media/[entityId]/route.js`
- `app/api/media-public/[entityId]/route.js`

#### Supporting maintenance/tooling
- `scripts/cleanup-test-data.mjs`
- `scripts/cleanup-test-data-runtime.sh`
- `docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md`

### 12.2 Docs that must be kept in sync

- PRD if any prerequisite decision changes visible scope.
- Hardening addendum if blocker decisions are resolved.
- Intake report if implementation reveals the earlier analysis was materially incomplete.
- Media storage spec if upload lifecycle or delivery semantics are materially updated.
- Admin/content contracts if new DTOs become explicit system truth.

### 12.3 Non-negotiable for the future implementation agent

**AUTONOMOUS DISCRETION FORBIDDEN**
- inventing product decisions where this plan marks prerequisite/blocker;
- widening scope beyond image-only V1;
- reintroducing unsupported media SEO fields;
- collapsing `media_asset` and `gallery` into one truth;
- moving editing into the right rail;
- weakening archive/delete safety because it is easier to code;
- shipping fake usage visibility;
- implementing variants without lineage-safe approval;
- treating keyboard/accessibility as post-V1 polish.

**AUTONOMOUS DISCRETION ALLOWED**
- bounded UI composition choices inside the approved shell and band scope;
- specific component decomposition;
- exact grid visuals and selection mechanics, as long as required behaviors and truth boundaries hold;
- pragmatic technical shape of query services once prerequisite decisions are closed;
- D&D deferral if it remains optional and primary upload CTA is complete.
