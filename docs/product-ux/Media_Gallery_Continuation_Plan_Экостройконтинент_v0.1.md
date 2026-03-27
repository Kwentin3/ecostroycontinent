# Media Gallery Continuation Plan

Статус: continuation plan v0.1  
Назначение: следующий практический план поверх уже shipped V1 media workspace.  
Опорные артефакты:
- `docs/ЭКРАН МЕДИА-ГАЛЕРЕИ.PRD v3.md`
- `docs/product-ux/Media_Gallery_PRD_Hardening_Addendum_Экостройконтинент_v0.1.md`
- `docs/reports/2026-03-27/eco.media-gallery-implementation.v1.report.md`
- `docs/reports/2026-03-27/eco.media-gallery-collections-fold-in.v1.report.md`
- `docs/reports/2026-03-27/eco.media-collections-admin-surface-cleanup.v1.report.md`

## 1. Executive summary

**FACT** Shipped V1 уже закрыла основную операторскую ценность PRD:
- gallery-first media workspace;
- browse/search/filter/select;
- inspector;
- upload overlay;
- metadata edit overlay;
- `find-me-after-save`;
- draft reuse;
- collections folded into media workspace;
- `Галереи` removed as admin-visible primary surface.

**FACT** Deferred areas были разумными controlled deferrals, а не провалом поставки:
- rich image editing;
- derived variants;
- archive/delete lifecycle;
- richer usage visibility;
- broader broken asset semantics.

**RECOMMENDATION** Следующая волна должна идти в жёстком порядке:
1. richer usage + safety signals,
2. archive/withdraw workflow,
3. minimal image editing layer,
4. only then variant semantics if explicitly approved.

**RISK** Самый опасный drift сейчас не в UI, а в скрытом lifecycle scope creep:
- image editing легко тащит variant semantics;
- archive UI легко врёт без honest usage aggregation;
- broken state легко смешивает admin preview и CDN delivery.

## 2. What V1 already delivered

| Capability | Status | Basis | Note |
| --- | --- | --- | --- |
| Gallery-first media workspace | **FACT** shipped | implementation report + code | `MediaGalleryWorkspace` is primary operator surface |
| Search / sorting / fast filters | **FACT** shipped | implementation report + code | includes `Без alt`, `Сироты`, `Используется`, `Опубликовано`, `Проблемные` |
| Inspector + overlay split | **FACT** shipped | PRD fit + code | right side stays support-only |
| Upload inside workspace | **FACT** shipped | implementation report + API | single-item finish-first flow |
| Metadata editing | **FACT** shipped | code | honest narrow metadata contract only |
| `find-me-after-save` | **FACT** shipped | implementation report + code | saved asset stays visible/selected |
| Draft reuse | **FACT** shipped | implementation report | downstream pickers now see latest media cards |
| Collections folded into Media | **FACT** shipped | fold-in report + code | collection create/edit/search inside media workspace |
| Gallery admin surface removal | **FACT** shipped | cleanup report + code | operator sees `Коллекции`, not `Галереи` |
| Broken admin-preview signal | **PARTIALLY DONE** | code | `brokenBinary` only |
| Usage visibility | **PARTIALLY DONE** | code + report | direct references only |
| Archive/delete safety | **PARTIALLY DONE** | code + report | `archiveBlocked` signal exists, no operator action |
| Image editing | **DEFERRED** | implementation report + code | overlay has metadata only |
| Derived variants | **DEFERRED** | implementation report + addendum | no lineage contract in code |

## 3. PRD delta still open

### 3.1 Open delta from PRD

| PRD capability | Current state | Classification | Basis |
| --- | --- | --- | --- |
| Image editing mode in overlay | not present | **DEFERRED** | PRD + code |
| Crop / rotate / flip / basic finetune | not present | **DEFERRED** | PRD + code |
| Derived variant flow | not present | **DEFERRED** | PRD + addendum + report |
| Archive / withdraw / quarantine operator flow | no action exposed | **DEFERRED** | PRD + code |
| Usage count + richer usage summary | direct references only | **PARTIALLY DONE** | code + report |
| Broken state beyond admin preview/storage | not represented | **DEFERRED** | addendum + code |
| D&D upload | not confirmed in current shipped UI | **PARTIALLY DONE / OPTIONAL** | PRD + current overlay behavior |
| Multi-upload | not implemented | **DEFERRED** | PRD |
| Inspector-level usage detail by entity type | minimal only | **PARTIALLY DONE** | code |

### 3.2 What should not be treated as missing V1 failure

**FACT**
- variants were intentionally deferred;
- archive/delete actions were intentionally deferred;
- public CDN health was intentionally not folded into current broken signal;
- heavy usage graph and entity-type analytics were never required for the shipped base.

**RECOMMENDATION**
These should be treated as continuation scope, not as “unfinished V1 redo”.

## 4. Deferred capabilities assessment

### 4.1 Rich image editing

**FACT** Current overlay edits metadata only.  
**PRD** expects an `Изображение` mode inside the same large overlay.  
**RISK** This is the most valuable deferred capability, but it is also the most scope-sensitive.

**RECOMMENDATION**
Do it next only as a minimal image-editing layer:
- crop,
- rotate,
- flip,
- optional simple reset.

Do **not** start with:
- advanced finetune matrix,
- heavy variant manager,
- background jobs,
- batch image processing.

### 4.2 Derived variants

**DEFERRED**

**PREREQUISITE**
Needs explicit lineage semantics before implementation:
- whether variant is a new `media_asset`;
- how lineage is persisted;
- whether variant inherits metadata or starts from copied metadata;
- how usage and archive rules treat parent/child relation.

**RECOMMENDATION**
Keep variants out of the immediate next band unless owner explicitly confirms minimal lineage-safe contract.

### 4.3 Archive/delete lifecycle

**PARTIALLY DONE**

Current system already exposes `archiveBlocked` and honest safety copy, but no operator action or lifecycle path is shipped.

**RECOMMENDATION**
This is worth doing next because:
- the UI already surfaces safety context;
- the PRD already fixes the posture;
- it improves operator trust without reopening domain truth.

**PREREQUISITE**
One canonical operator term must be fixed before this band starts:
- `archive`
- or `withdraw`
- or `quarantine`

UI labels, API comments, reports, and follow-up implementation notes must not drift across multiple lifecycle words for the same action.

### 4.4 Richer usage visibility

**PARTIALLY DONE**

Current implementation provides direct reference aggregation:
- collection membership,
- service/case/page references.

**RISK**
This is honest but narrow. It does not yet present a richer usage summary layer that can drive safety and operator explanation more gracefully.

**RECOMMENDATION**
Do next as a bounded aggregation enhancement, not as analytics.

### 4.5 Broken asset semantics

**PARTIALLY DONE**

Current `Сломан` badge reflects storage/admin-preview truth only.

**RECOMMENDATION**
Next step should clarify and extend this carefully:
- either keep V1.1 broken signal explicitly admin/storage-only,
- or split into `storage/admin broken` vs `public delivery degraded`.

Do not introduce a single misleading mega-status.

## 5. Recommended next-scope

### Recommended next pack

1. **Usage and safety pack**
   - richer usage summary in inspector;
   - stronger archive/withdraw blocking explanation;
   - explicit archive action for unused assets only.

2. **Minimal image editing pack**
   - `Изображение` tab inside current overlay;
   - crop / rotate / flip only;
   - overwrite drafts only;
   - published assets stay safe.
   - no hidden variant semantics.

3. **Broken-signal clarification pack**
   - distinguish current admin-preview failure from future public-delivery failure;
   - keep operator wording honest.

### Useful but can wait

- simple multi-upload
- richer entity-type usage filters
- public-delivery diagnostics in operator UI
- variant lineage visualization

### Should stay out of scope for now

- heavy DAM behaviors
- asset analytics dashboards
- batch queue/orchestration
- broad variant family management
- public-site delivery redesign

## 6. Prerequisites and decisions needed

### 6.1 Needed before the next implementation wave

| Topic | Status | Why it matters |
| --- | --- | --- |
| Archive action vocabulary (`archive`, `withdraw`, `quarantine`) | **PREREQUISITE** | UI, code comments and proof docs cannot ship honestly without one canonical term |
| Minimal broken-state split or explicit narrow rule | **PREREQUISITE** | prevents misleading operator signals |
| Image editing save model for existing draft asset | **PREREQUISITE** | needed before crop/rotate writes anything |
| Variant scope | **PREREQUISITE** | required if image editing is allowed for published assets |

### 6.2 Explicitly not needed if scope stays narrow

**FACT**
- no new gallery entity design;
- no shell rework;
- no new CDN architecture;
- no new SEO contract for `media_asset`.

## 7. Suggested continuation plan

### Band 1. Usage and archive truth

**Objective**
Turn current direct reference signals into a clearer operator-facing usage/safety layer and expose archive action only where it is safe.

**Scope**
- richer usage summary in inspector;
- more explicit “why blocked” messages;
- archive action for assets with zero usage references;
- post-archive selection behavior.

**Prerequisites**
- archive terminology fixed;
- keep direct reference aggregation as truth source unless owner asks for more.

**Proof**
- unused asset can be archived from media workspace;
- used asset shows disabled archive with honest reason;
- selection after archive is predictable;
- history/audit note exists for lifecycle action.

**RISK**
- if team tries to turn this into full delete/restore workflow, scope will balloon.

### Band 2. Minimal image editing

**Objective**
Add one practical `Изображение` mode to the existing overlay without blowing up storage and variant semantics.

**Scope**
- crop;
- rotate;
- flip;
- reset to original within current editing session;
- draft overwrite only.

**PREREQUISITE**
This band is allowed only under a narrow technical rule:
- edited output may replace the binary of the same asset only for a `draft` asset;
- this replacement must not silently introduce parent/child or lineage semantics;
- published assets are explicitly out of this overwrite path.

**Recommended implementation posture**
- keep editing inside the current overlay;
- treat edited output as a new uploaded binary for the same draft asset only;
- do not generalize this into a reusable variant model;
- do not expose variant creation in this band.

**Proof**
- draft asset can be cropped and saved;
- preview updates in overlay, grid and inspector;
- original metadata remains intact;
- save error does not lose current edit session abruptly.

**RISK**
- published assets cannot follow the same overwrite path honestly;
- draft-only editing must not be broadened in code into an implicit lineage system;
- bringing them into this band without variant contract would be drift.

### Band 3. Broken-state clarification

**Objective**
Make `Сломан` operator-facing and honest beyond today’s narrow implicit rule.

**Scope**
- explicit broken-state copy;
- optionally split badges or inspector notes:
  - admin/storage preview broken
  - public delivery degraded

**Prerequisites**
- decide whether CDN/public delivery belongs in this wave or stays out.

**Proof**
- an asset with missing admin preview shows the right signal;
- CDN degradation does not silently masquerade as local storage corruption.

### Optional Band 4. Variants only after decision

**Objective**
Add minimal derived variant flow only if lineage semantics is explicitly approved.

**Scope**
- `Создать вариант` from overlay;
- new `media_asset` creation with parent reference;
- parent stays untouched;
- variant returns into same workspace and is discoverable.

**Blocker**
- no implementation should start here without explicit owner decision.

## 8. Risks and cautions

### RISK
Image editing is the easiest place to accidentally smuggle in a full asset-processing subsystem.

### RISK
Archive UI without honest reference truth will immediately feel unsafe.

### RISK
If variants enter scope without a lineage contract, the implementation will invent hidden semantics in code.

### RISK
Mixing admin-preview failures and CDN delivery failures into one badge will reduce trust in the signals the screen already earned.

### RISK
Current shipped UX model is strong. A continuation wave must extend it, not reopen:
- inspector vs editor split;
- media vs collection split;
- one primary workspace.

## 9. Final recommendation

### Do now

- richer usage summary
- archive/withdraw safety flow for unused assets
- only after that: minimal image editing inside the existing overlay for draft assets only

### Do later

- simple multi-upload
- richer type-specific usage filters
- public-delivery diagnostics as a dedicated infra/operator enhancement

### Do only after explicit decision

- derived variants
- published-asset image editing
- any lineage-aware variant UI
- any broader delete/restore workflow beyond narrow archive posture
