# ECO.MEDIA_GALLERY.PRD_LANDSCAPE_INTAKE.V1

Source PRD under review:
- `docs/ЭКРАН МЕДИА-ГАЛЕРЕИ.PRD v3.md`

## 1. Executive summary

**FACT** The attached PRD is directionally strong and already fits the project much better than a blank-slate “design a media gallery” concept.

**FACT** It preserves several critical project truths instead of reopening them:
- `MediaAsset` and `Gallery` remain separate entities.
- admin remains a write-side content operations tool, not a DAM/platform rewrite.
- binary truth remains in object storage, metadata truth remains in SQL/content revisions.
- right rail is kept as inspector/support context rather than the main editor.
- overwrite of published assets is explicitly rejected.
- the current fake/generic SEO leakage on `media_asset` is explicitly called out and rejected.

**RISK** The PRD is not yet fully ready for autonomous implementation planning as-is, because several parts depend on contracts or workflow decisions that do not yet exist in the system:
- upload lifecycle for the new overlay-first flow,
- usage visibility source of truth,
- status model on cards,
- variant semantics and data lineage,
- draft-vs-published reuse policy,
- “broken asset” truth conditions.

**FACT** The biggest strength of the PRD is that it narrows the metadata contract instead of expanding it.

**RISK** The biggest implementation risk is that the PRD currently reads cleaner than the current backend/query/state reality. A future autonomous agent could easily drift into inventing hidden contracts unless these gaps are hardened first.

**Assessment**
- Overall product direction: strong.
- Landscape fit: mostly aligned.
- Implementation readiness: **ready after minimal hardening**, not ready for unconstrained autonomous execution yet.

## 2. What in the PRD is already well aligned

### 2.1 Domain separation is preserved

**FACT** The PRD explicitly keeps `MediaAsset` and `Gallery` as different entities and says the new surface is one working place, not one collapsed entity.

**Basis**
- PRD sections 2, 3, 8, 23.
- Existing canon: `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
- Code: `lib/content-core/schemas.js`

**Why this is good**
- It matches the current domain model.
- It avoids a very common gallery-epic failure mode: hiding a real grouping entity behind “one media thing”.

### 2.2 The PRD correctly respects the admin posture

**FACT** The PRD stays within the write-side content-operations posture and explicitly rejects enterprise DAM expansion.

**Basis**
- PRD sections 2, 7.
- Canon docs: `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`, `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`

**Why this is good**
- It keeps the epic phase-1 sized.
- It gives future implementation planning a bounded surface.

### 2.3 The PRD aligns with shell/navigation canon

**FACT** The PRD does not try to turn the sidebar into a media tree and does not make the right rail a full metadata workspace.

**Basis**
- PRD sections 2, 8, 15, 16.
- Existing shell canon: `docs/product-ux/EKOSTROY.UI.VERSTKA_PENDING_CARRYOVERS_PLAN_Экостройконтинент_v0.1.md`
- Current shell implementation: `components/admin/AdminShell.js`, `components/admin/admin-ui.module.css`

**Why this is good**
- It stays compatible with the already stabilized admin shell.
- It lowers UI drift risk for the future planner.

### 2.4 The PRD is honest about metadata on media

**FACT** The PRD explicitly narrows V1 `media_asset` metadata to:
- `title`
- `alt`
- `caption`
- `sourceNote`
- `ownershipNote`

**FACT** It also explicitly rejects generic SEO-looking shared-form fields on `media_asset` until a real persistence contract exists.

**Basis**
- PRD section 9.
- Existing code conflict: `components/admin/EntityEditorForm.js`, `lib/content-core/pure.js`, `lib/content-core/schemas.js`

**Why this is good**
- It directly addresses the biggest current UI/contract lie.
- It gives the implementation plan a clean honesty rule.

### 2.5 The PRD correctly treats published overwrite as unsafe

**FACT** The PRD explicitly disallows overwriting published assets and prefers derived variants.

**Basis**
- PRD section 18.
- Current project posture around publish/history safety is consistent with this, even if media-specific variant mechanics do not yet exist.

**Why this is good**
- It matches the project’s audit/revision/publish truth.
- It avoids breaking live pages/cases/services via silent replacement.

### 2.6 The PRD keeps the operator mental model clear

**FACT** The PRD’s intended structure is coherent:
- gallery for browse/select,
- inspector for context,
- large overlay for actual editing.

**Basis**
- PRD sections 10, 15, 16.

**INFERENCE** This is well aligned with the actual operator pain found in the anamnesis report: current screen is too entity-form-first.

## 3. Canon / architecture / workflow conflicts

### 3.1 No hard conflict with shell canon, but there is a boundary to protect

**FACT** The PRD places quick context in the right inspector and main editing in a large overlay.

**RISK** This is compatible with the shell canon only if the inspector stays compact and non-editorial. If implementation starts moving real metadata editing, image editing, or multi-step workflows into the right panel, the PRD will drift into a shell conflict.

**Basis**
- PRD sections 10, 15, 16.
- Canon docs: `EKOSTROY.UI.VERSTKA_PENDING_CARRYOVERS_PLAN_Экостройконтинент_v0.1.md`

**Assessment**
- Not a blocker now.
- Must become an explicit future implementation guardrail.

### 3.2 The PRD’s card status language is more ambitious than current system truth

**FACT** The PRD wants card-level signals such as `draft/review/published or local equivalent`.

**FACT** Current system has two different state layers already:
- revision state (`draft`, `review`, `published`) at revision level,
- media payload `status` (`draft_asset`, `ready`) at asset payload level.

**Basis**
- PRD section 13.
- Code: `lib/content-core/content-types.js`, `lib/content-core/schemas.js`, `components/admin/EntityEditorForm.js`

**RISK** Without an explicit rule, future implementation may invent a mixed status badge model ad hoc.

**Assessment**
- Needs clarification before autonomous planning.
- Not resolved by layout alone.

### 3.3 “Broken asset” is right product-wise but currently underspecified technically

**FACT** The PRD correctly insists on a broken-asset signal.

**FACT** Current system has multiple delivery/read paths:
- admin preview route reads from storage directly: `app/api/admin/media/[entityId]/preview/route.js`
- public delivery route redirects to delivery URL in s3 mode: `app/api/media/[entityId]/route.js`
- public fallback/proxy-like route exists: `app/api/media-public/[entityId]/route.js`
- CDN can be degraded while admin preview still works

**Basis**
- PRD section 13.
- Code: `app/api/admin/media/[entityId]/preview/route.js`, `app/api/media/[entityId]/route.js`, `app/api/media-public/[entityId]/route.js`
- Inferred from current infra/runtime behavior.

**RISK** “Broken” can mean at least three different things:
- binary missing in storage,
- admin preview broken,
- public delivery/CDN broken.

**Assessment**
- This is an implementation-sensitive blocker if left vague.
- The PRD should define which broken states are required in V1 and which are secondary.

### 3.4 The PRD’s archive/delete posture is aligned in spirit but depends on a new usage-truth layer

**FACT** The PRD chooses a safe rule: archive/delete blocked whenever there is any usage reference, draft or published.

**FACT** Current system does not expose a real usage graph yet. `whereUsedLabel` is currently hardcoded to `Пока не используется`.

**Basis**
- PRD sections 21, 22.
- Code: `lib/admin/entity-ui.js`

**RISK** This is not a copy tweak. It needs a real reverse-reference layer across:
- services,
- cases,
- pages,
- galleries,
- draft and published contexts.

**Assessment**
- This is a prerequisite, not a cosmetic enhancement.
- Without it, autonomous implementation could fake usage visibility and deletion blocking.

### 3.5 The PRD’s upload finish-first flow conflicts with the current direct upload route

**FACT** The PRD wants this sequence:
- user selects file,
- large overlay opens,
- user sees preview,
- user edits image/metadata,
- only then saves the new asset as a meaningful object.

**FACT** Current code does this:
- upload form posts file immediately,
- binary is stored immediately,
- `media_asset` draft entity is created immediately,
- user lands in entity detail afterwards.

**Basis**
- PRD section 19.
- Code: `app/api/admin/media/upload/route.js`

**RISK** These are different lifecycle models.

**Assessment**
- This is a real workflow prerequisite.
- Future implementation planning must decide whether V1 uses:
  1. client-side temporary file state until final save,
  2. temporary persisted upload draft with cleanup semantics,
  3. a new upload slot/finalize contract.

## 4. Code / contract / system dependencies

### 4.1 What is already supported by the current system

**FACT** The following foundations already exist and can be reused:
- first-class `media_asset` entity
- first-class `gallery` entity
- revisioned content save model
- authenticated admin preview route
- storage abstraction (`local` / `s3`)
- public delivery indirection via entity ID
- reusable media picker component
- public read-side that resolves galleries into assets

**Basis**
- Code: `lib/content-core/schemas.js`, `lib/content-core/repository.js`, `lib/media/storage.js`, `components/admin/MediaPicker.js`, `lib/read-side/public-content.js`

### 4.2 What clearly requires contract extension or new service logic

#### Usage visibility

**FACT** There is no honest current source of truth for:
- usage count,
- usage summary,
- safe-to-archive evaluation,
- used/unused card badges.

**Basis**
- Code: `lib/admin/entity-ui.js`
- Current relation model spread across service/case/page/gallery payloads.

**RECOMMENDATION** Introduce an explicit usage aggregation service/DTO instead of inferring this inside UI components.

#### Gallery-first list queries

**FACT** Current list page loads generic entity cards and renders a table. There is no dedicated media library query for:
- search by multiple metadata fields,
- filter buckets,
- sort modes,
- preview-rich cards,
- selection-aware grid data.

**Basis**
- Code: `app/admin/(console)/entities/[entityType]/page.js`
- Existing query path: `listEntityCards()` / published cards logic.

**RISK** If this remains unspecified, the future implementation may hardcode client-side filtering over a full dataset.

#### Draft media reuse

**FACT** Current relation options for galleries/media use published cards only.

**Basis**
- Code: `lib/admin/entity-ui.js`
- Readiness rules also require published references in several flows: `lib/content-ops/readiness.js`

**RISK** The PRD’s operator promise of “upload and immediately make useful” conflicts with current published-only reuse posture.

**Assessment**
- Needs explicit product/contract decision before implementation planning.

#### Variant semantics

**FACT** Current code has no variant lineage model, no derivative metadata model, and no image-edit pipeline.

**Basis**
- Search in `app/`, `components/`, `lib/`: no real image-edit/variant implementation found.

**Assessment**
- Derived variants are not just a modal UI concern.
- They require a contract decision.

### 4.3 What likely requires refactor rather than just extension

**FACT** Current `EntityEditorForm` is a shared generic editor that leaks generic SEO fields into media.

**Basis**
- Code: `components/admin/EntityEditorForm.js`

**INFERENCE** A gallery-first media surface can reuse parts of this infrastructure, but not as a simple restyle. It will likely need a dedicated media workspace component instead of remaining a thin variation of the generic entity form.

### 4.4 What likely requires new client-side state logic

**FACT** The PRD introduces behavior that does not exist in current screen architecture:
- persistent selection state,
- inspector open/close semantics,
- overlay open/close semantics,
- keyboard grid navigation,
- find-me-after-save behavior,
- error retention in overlay after failed save/upload.

**Basis**
- PRD sections 16, 19, 20, 24.
- Current media screen is primarily form-post + server-rendered detail.

**Assessment**
- This is feasible, but it means the future implementation plan needs an explicit client-state/UI track.

## 5. Implementation-sensitive gaps

### 5.1 Metadata contract honesty is improved, but still needs one explicit PRD note

**FACT** The PRD correctly narrows media fields.

**RISK** The document still needs one hard sentence that `media_asset` does not own generic SEO fields in V1 and that gallery SEO remains separate.

**Why this matters**
- Without that wording, an implementation agent could reintroduce the current shared-form leakage “because the fields already exist on screen”.

### 5.2 Upload lifecycle is the single biggest workflow gap

**FACT** The desired overlay-first upload flow is not what the current backend does.

**RISK** This gap can easily cause autonomous drift because there are several plausible implementation paths, each with different consequences:
- local in-browser temp state,
- persisted temporary draft entity,
- slot/finalize flow,
- upload-first then edit-first redirect disguised as overlay.

**Assessment**
- This is a prerequisite decision.
- Not safe to leave implicit.

### 5.3 Variant/overwrite policy is good product-wise but undercontracted technically

**FACT** The PRD says:
- overwrite allowed only for draft assets,
- published assets require derived variant.

**RISK** The current system has no explicit contract for:
- parent/child variant lineage,
- replacement target selection,
- how derived variants surface in usage or gallery groupings,
- whether a variant is just another `media_asset` or something richer.

**Assessment**
- If image editing and variants stay in V1, this is a blocker-level prerequisite.
- If not, it should be downgraded to V1.1/V2 in the PRD.

### 5.4 Search/sort/filter feasibility is only partially grounded

**FACT** The requested fields for search are plausible against current metadata.

**FACT** Search by `title`, `originalFilename`, `alt`, `caption`, `sourceNote`, `ownershipNote` matches existing media payload fields.

**Basis**
- PRD section 14.
- Code: `lib/content-core/schemas.js`

**RISK** Feasibility changes depending on the expected data volume and whether V1 is allowed to be client-filtered or must be server-query-backed.

**Assessment**
- Not a blocker, but the future implementation plan needs an explicit scale assumption.

### 5.5 Keyboard/grid behavior has no current implementation base

**FACT** The PRD makes keyboard navigation a real V1 requirement.

**FACT** No current grid-navigation implementation was found in the current admin media surface.

**Basis**
- PRD section 24.
- Code search: no meaningful current keyboard/grid implementation found.

**Assessment**
- This is valid and useful, but it must be planned explicitly, not treated as free polish.

### 5.6 Find-me-after-save is a real requirement and should stay implementation-agnostic

**FACT** The PRD currently states the right outcome, not one forced mechanism.

**Basis**
- PRD section 16.

**Assessment**
- Good as written.
- Keep it outcome-based in future planning.

### 5.7 Broken asset signal must not collapse infrastructure failures into content truth

**FACT** Current system already knows that storage and CDN can degrade independently.

**Basis**
- Current runtime posture, admin health block, storage/delivery split.

**RISK** If the future gallery marks assets as “broken” purely because CDN is temporarily degraded, the operator may receive false content alarms.

**RECOMMENDATION** Split broken signals into at least:
- storage/admin-preview broken,
- public-delivery degraded.

## 6. Autonomy-readiness assessment

### 6.1 What is fixed enough for autonomous implementation work later

**FACT** These product decisions are already sufficiently pinned:
- gallery-first browse model,
- single working place rather than separate competing truths,
- inspector on the right, heavy editing in overlay,
- narrow media metadata contract,
- no generic SEO lie on media,
- no overwrite for published assets,
- alt/status/usage/broken signals as core operator value,
- find-me-after-save as mandatory outcome,
- archive/delete safety posture.

### 6.2 Where future autonomous implementation is likely to drift without more hardening

**RISK** High drift zones:
- inventing a new status model on cards,
- inventing variant lineage semantics ad hoc,
- silently choosing one upload lifecycle without product sign-off,
- faking usage visibility from partial heuristics,
- reusing right rail as a mini editor to save implementation effort,
- keeping generic SEO fields on media because the shared editor already has them,
- conflating storage failure and CDN failure into one “broken” badge.

### 6.3 Overall autonomy-readiness assessment

**Assessment**
- The PRD is **not ready now** for unconstrained autonomous implementation planning.
- It is **ready after minimal hardening** if a small number of contract and workflow clarifications are added.

## 7. Minimal hardening recommendations for the PRD

### 7.1 Add an explicit V1 scope sentence: image-only

**RECOMMENDATION** Add a short note under scope or metadata contract:

> V1 remains image-only. This PRD does not introduce video/document support and does not assume non-image media contracts.

**Basis**
- Code currently supports only `assetType: image`.

### 7.2 Add an explicit card-status contract note

**RECOMMENDATION** Add a clarifying note near sections 13/14:

> Card status in V1 must be derived from existing revision state and/or current asset readiness contract. V1 must not introduce a new parallel status machine without an approved contract decision.

### 7.3 Add an explicit upload-lifecycle clarification note

**RECOMMENDATION** Add a short addendum to section 19:

> PRD fixes the user-visible workflow outcome, but implementation must still choose and explicitly approve one technical lifecycle for unsaved uploads: in-browser temporary state, temporary persisted draft, or upload-finalize flow. This choice is a prerequisite for implementation planning.

### 7.4 Add an explicit usage-truth note

**RECOMMENDATION** Add to sections 21/22:

> Usage visibility and archive/delete blocking must be driven by an explicit usage aggregation layer over existing references. UI heuristics or partial string labels are not sufficient.

### 7.5 Add an explicit broken-signal clarification

**RECOMMENDATION** Add to section 13:

> “Broken asset” in V1 must distinguish missing/broken binary/admin preview from public delivery/CDN degradation where feasible. The UI must not mark content as broken based solely on a transient external delivery outage unless this is an explicitly chosen operator rule.

### 7.6 Downgrade or pin variant scope explicitly

**RECOMMENDATION** Pick one of two hardening paths:
- keep image editing in V1 but move `derived variant` to V1.1/V2, or
- keep variants in V1 only if the PRD adds a very small explicit contract note that a derived variant is a new `media_asset` and requires approved lineage/replacement semantics.

**Assessment**
- This is the strongest remaining product/technical ambiguity after upload lifecycle.

### 7.7 Add one explicit note on draft asset reuse

**RECOMMENDATION** Add a line under goals or usage/reuse section:

> V1 must explicitly decide whether freshly uploaded draft assets become selectable immediately in editorial flows, or whether reuse remains limited to published assets. This is a contract decision, not a UI preference.

## 8. Required clarifications before autonomous implementation planning

1. **Upload lifecycle choice**
   - Which technical path backs the overlay-first upload flow?

2. **Variant contract**
   - Is derived variant in V1 or deferred?
   - If in V1, what is the persisted relationship to the source asset?

3. **Usage aggregation source of truth**
   - Which entities count as references?
   - Do draft and published references both count for safety blocking? The PRD says yes, but current system needs a service to compute that.

4. **Card status contract**
   - Which exact state model is shown to the operator on cards?

5. **Broken asset semantics**
   - Which failure paths are surfaced in V1?
   - Must the UI distinguish storage/admin-preview issues from CDN/public-delivery issues?

6. **Draft media reuse policy**
   - May a newly uploaded draft asset be selected immediately in service/case/page/gallery flows?

7. **Search/filter scale assumption**
   - Is V1 allowed to be small-data/client-side, or should it assume query-backed search/filter from the start?

8. **Drag-and-drop**
   - Desired in V1, optional in V1, or explicitly deferred?

## 9. Suggested stop triggers for future implementation plan

A future autonomous implementation plan should stop and escalate if:
- a solution starts collapsing `MediaAsset` and `Gallery` into one fuzzy domain object;
- the right inspector begins to act as the primary metadata editor;
- implementation needs new persisted fields or variant lineage semantics that are not explicitly approved;
- usage visibility is being implemented from incomplete heuristics rather than an explicit aggregation source;
- upload flow requires a technical lifecycle choice that has not been approved;
- card status requires inventing a new state machine beyond current revision/readiness truth;
- the plan reintroduces generic SEO fields on `media_asset` without a new contract decision;
- “broken” status is implemented in a way that conflates content truth with transient CDN/infrastructure outages;
- search/filter/sort assumes scale characteristics that the current query model cannot honestly support.

## 10. Suggested next-step chain

1. **Minimal PRD hardening**
   - Add the small clarifications above without rewriting the PRD from scratch.

2. **Short contract-decision addendum**
   - Upload lifecycle.
   - Variant semantics.
   - Usage aggregation truth.
   - Draft reuse policy.
   - Card status truth.

3. **Autonomous implementation planning**
   - Split into at least:
     - gallery/list + selection/inspector shell,
     - metadata/editor overlay,
     - backend query/usage/status support,
     - optional image-edit/variant track only if contract is approved.

4. **Implementation / delivery**
   - UI and backend should be planned together; this is not a pure layout epic.

5. **Post-implementation verification**
   - Re-test on real storage/runtime state, ideally with cleaned probe data and real operator flows.

## 11. Appendix

### 11.1 Affected files / screens / contracts / services / models

#### PRD / canon / supporting docs
- `docs/ЭКРАН МЕДИА-ГАЛЕРЕИ.PRD v3.md`
- `docs/reports/2026-03-27/eco.media-gallery-context-pack.v1.report.md`
- `docs/product-ux/Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`
- `docs/product-ux/EKOSTROY.UI.VERSTKA_PENDING_CARRYOVERS_PLAN_Экостройконтинент_v0.1.md`
- `docs/product-ux/EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md`

#### Current media/gallery/admin surfaces
- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/MediaPicker.js`
- `components/admin/AdminShell.js`
- `components/admin/admin-ui.module.css`
- `lib/admin/entity-ui.js`
- `lib/admin/screen-copy.js`
- `lib/admin/infra-health.js`

#### Domain / model / storage / read-side
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/content-core/repository.js`
- `lib/content-core/service.js`
- `lib/content-core/content-types.js`
- `lib/content-ops/readiness.js`
- `lib/media/storage.js`
- `lib/read-side/public-content.js`
- `components/public/PublicRenderers.js`
- `lib/config.js`

#### API endpoints
- `app/api/admin/media/upload/route.js`
- `app/api/admin/media/[entityId]/preview/route.js`
- `app/api/admin/entities/[entityType]/save/route.js`
- `app/api/media/[entityId]/route.js`
- `app/api/media-public/[entityId]/route.js`

#### DB / contracts
- `db/migrations/001_admin_first_slice.sql`

### 11.2 Likely impacted domains / docs / APIs

**FACT** This PRD touches more than one layer:
- admin UI shell/workspace behavior,
- content-core schema/query DTOs,
- media storage/edit lifecycle,
- usage aggregation logic,
- editorial workflows in service/case/page/gallery reuse,
- public delivery diagnostics indirectly through broken-asset semantics.

### 11.3 Anything the next planner must not miss

- `media_asset` and `gallery` are both real and both must survive.
- current media SEO UI is lying; the PRD is right to remove that lie.
- draft reuse is a workflow issue, not a spacing issue.
- usage visibility cannot be faked if delete/archive rules depend on it.
- image editing is not just a component choice; variant semantics matter.
- the right rail cannot become a hidden second editor.
- admin preview and public delivery are different health paths.
- probe/test content and infra degradation can distort operator judgment if not accounted for.

## PRD status for autonomous implementation planning

### Ready now
- One working place / gallery-first browse posture.
- Preserve `MediaAsset` vs `Gallery` separation.
- Inspector-right / editor-overlay split.
- Narrow honest metadata contract for `media_asset`.
- No generic SEO fields on media without contract.
- No overwrite of published assets.
- Find-me-after-save as required outcome.
- Archive/delete default posture remains safe and non-destructive.

### Ready after minimal hardening
- Card status and badge model.
- Broken-asset semantics.
- Usage visibility / usage summary wording.
- D&D priority wording.
- Explicit V1 image-only statement.
- Explicit draft reuse policy statement.

### Not ready until resolved
- Technical lifecycle behind overlay-first upload flow.
- Variant lineage/replacement semantics if variants remain in V1.
- Real usage aggregation source of truth if archive/delete blocking and usage count are V1 requirements.
- Any implementation path that would require new persisted contracts without prior approval.
