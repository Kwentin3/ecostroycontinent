# ECO.MEDIA_GALLERY.CONTEXT_PACK.ANAMNESIS.V1

## 1. Executive summary

This context pack establishes the current engineering truth around the `media_asset` and `gallery` surfaces before any new PRD / UX / implementation planning for a more gallery-oriented media screen.

The current system already has a real media domain, not just an upload utility:
- `media_asset` is a first-class content entity.
- `gallery` is a separate first-class content entity.
- metadata truth lives in SQL/content revisions.
- binary truth lives in object storage.
- public delivery is intended to go through CDN, while admin preview can bypass CDN.

At the same time, the current media UI is still entity-form-first rather than gallery-first:
- list view is a plain table.
- detail view is a long editor form with quick upload at the top.
- reuse happens mostly from other entity editors through `MediaPicker`.
- draft media and galleries are currently hard to reuse because pickers are fed from published cards only.

The biggest engineering/product findings are:
1. The docs already define a good canonical split: SQL metadata, S3 binary storage, CDN public delivery, separate `media_asset` and `gallery`, no delete-by-default.
2. The code implements a simpler, narrower reality than the docs:
   - only `image` media is supported.
   - no real upload-finalize pipeline.
   - no thumbnail/variant processing.
   - no bulk/library affordances.
3. The current media detail screen visibly renders generic SEO fields, but the `media_asset` schema/save path does not persist SEO data. This is a real docs/code/UI conflict, not just a cosmetic issue.
4. The current operator experience conflicts with the intended editorial workflow because uploaded draft media is not naturally reusable in downstream pickers.
5. The future gallery-oriented redesign must not reopen already fixed shell grammar and must not move main metadata work into the right rail, because the right rail is already canonically reserved for support/status/history.

## 2. Canon already fixed and should not be reopened

| Canon | Status | Basis | Notes |
|---|---|---|---|
| Admin is a content operations tool, not a page builder or DAM-suite rewrite | FACT | Docs: `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`, `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md` | Future media work should stay narrow and phase-1-compatible |
| `media_asset` and `gallery` are separate entities | FACT | Docs + code: `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`, `lib/content-core/schemas.js` | Do not collapse them into one fuzzy object without strong reason |
| Metadata truth lives in SQL/content revisions, binary truth outside SQL | FACT | Docs: `Media_Storage_Operations_Spec`, code: `lib/content-core/repository.js`, `lib/media/storage.js` | Stable architectural boundary |
| Public media delivery should go through CDN/public delivery URL, not raw DB truth | FACT | Docs: `Media_Storage_Operations_Spec`, code: `app/api/media/[entityId]/route.js`, `lib/media/storage.js` | Admin preview and public delivery are intentionally different paths |
| Left sidebar = global navigation only | FACT | Docs: `docs/product-ux/EKOSTROY.UI.VERSTKA_PENDING_CARRYOVERS_PLAN_Экостройконтинент_v0.1.md` | Should not be turned into media tree navigation |
| Top breadcrumb/depth bar is the canonical nested-surface navigation pattern | FACT | Same as above | Relevant for future media gallery screen composition |
| Right rail is support/status/history only | FACT | Same as above | Important constraint: right rail is not the main metadata workspace |
| Hard delete is not the default lifecycle path for content/media | FACT | Docs: `Media_Storage_Operations_Spec`, `PRD_Admin_Console_First_Slice` | Archive/quarantine/withdrawal posture should remain preferred |
| `seo_manager` and `superadmin` are the content-editing roles | FACT | Code: `lib/auth/session.js`, docs: `SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md` | `business_owner` is review-oriented, not media-library primary operator |

## 3. Current media domain truth

### 3.1 What counts as a media asset

`media_asset` is a content entity whose latest revision payload currently contains:
- storage pointer fields (`storageKey`, `mimeType`, `originalFilename`, `sizeBytes`)
- editorial metadata (`title`, `alt`, `caption`)
- provenance/rights metadata (`ownershipNote`, `sourceNote`)
- upload metadata (`uploadedBy`, `uploadedAt`)
- local status (`draft_asset`, `ready`)

**Basis**
- FACT from code: `lib/content-core/schemas.js`
- FACT from upload flow: `app/api/admin/media/upload/route.js`

### 3.2 What counts as a gallery

`gallery` is a lightweight ordered grouping of media assets. Current schema includes:
- `title`
- `primaryAssetId`
- `assetIds`
- `caption`
- `relatedEntityIds`
- nested `seo`

**Basis**
- FACT from code: `lib/content-core/schemas.js`
- FACT from docs: `Admin_Content_Contract_First_Slice`, `Media_Storage_Operations_Spec`

### 3.3 Where media metadata truth lives

Current source of truth for media metadata is:
- `content_entities` row for entity identity / locale / timestamps
- `content_revisions.payload` JSON for the latest payload values
- `content_revisions.change_intent` for version note

Binary file truth lives outside SQL in object storage via the storage adapter.

**Basis**
- FACT from DB migration: `db/migrations/001_admin_first_slice.sql`
- FACT from repository layer: `lib/content-core/repository.js`
- FACT from storage layer: `lib/media/storage.js`

### 3.4 How media is related to content entities

Current relation model:
- `service` has `primaryMediaAssetId` and `galleryIds`
- `case` has `primaryMediaAssetId` and `galleryIds`
- `page` has `primaryMediaAssetId`
- gallery block payloads on pages can carry `galleryIds`
- `gallery` can carry `relatedEntityIds`

Public read-side really uses these relations.

**Basis**
- FACT from schemas: `lib/content-core/schemas.js`
- FACT from public read-side: `lib/read-side/public-content.js`
- FACT from public rendering: `components/public/PublicRenderers.js`

### 3.5 Which roles actually work with media

Current roles:
- `seo_manager`: can edit content, therefore can upload/edit media
- `superadmin`: can edit content and operate broader admin surfaces
- `business_owner`: review-oriented, not primary media operator

**Basis**
- FACT from code: `lib/auth/session.js`
- FACT from docs: `docs/product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`

## 4. Current media screen as-is

### 4.1 Routes and main components

Current media routes/components:
- media list route: `app/admin/(console)/entities/[entityType]/page.js`
- media detail route: `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- shared editor surface: `components/admin/EntityEditorForm.js`
- picker used elsewhere: `components/admin/MediaPicker.js`
- screen copy/helpers: `lib/admin/screen-copy.js`

### 4.2 Current interaction model

#### List screen
Current list screen is generic entity-list UI:
- counts packet at the top
- optional legend text
- simple table of entities
- `Новый` action

For media specifically, this is not a gallery grid. It is a generic table-driven admin list.

**Basis**
- FACT from route code: `app/admin/(console)/entities/[entityType]/page.js`
- FACT from live Playwright observation

#### Detail screen
Current media detail screen is a form-first editor composed of:
- top shell packet/header
- quick upload panel
- `Комментарий к изменению`
- preview block (`Превью файла`)
- metadata fields
- visible generic SEO block
- right rail with readiness, published version, audit history

This means current UX is built around editing one entity revision, not browsing a visual media library.

**Basis**
- FACT from component: `components/admin/EntityEditorForm.js`
- FACT from live Playwright observation

### 4.3 What the current media UI can do

| Capability | Current state | Basis |
|---|---|---|
| Upload binary | Yes | `app/api/admin/media/upload/route.js` |
| Show admin preview | Yes | `app/api/admin/media/[entityId]/preview/route.js` |
| Edit metadata | Yes | `components/admin/EntityEditorForm.js` + shared save route |
| Revision/change note | Yes | `changeIntent` via `content_revisions` |
| Reuse in other entity forms | Yes, but via separate picker surfaces | `components/admin/MediaPicker.js` |
| Delete from UI | No | Live UI + code |
| Archive/quarantine UI | No | Not found in current code |
| Search inside media picker | Yes, client-side only | `components/admin/MediaPicker.js` |
| Search on media list page | No | `app/admin/(console)/entities/[entityType]/page.js` |
| Filter on media list page | No | Same |
| Sort controls | No explicit UI | Same |
| Bulk actions | No | Same |
| Inline attach from media screen | No dedicated attach workflow | Inferred from current routes/components |
| Visual gallery grid on media screen | No | Live UI + list route |

### 4.4 Gallery screen as-is

Gallery is currently a separate entity surface with its own list/detail. Detail editing uses:
- `Файлы галереи` via multi-select `MediaPicker`
- `Основной файл` via single-select `MediaPicker`
- gallery-level caption and SEO

This means the current system already distinguishes:
- media asset library items
- gallery as reusable grouped composition

**Basis**
- FACT from `components/admin/EntityEditorForm.js`
- FACT from `lib/content-core/schemas.js`

## 5. Data model / contracts / APIs / storage findings

### 5.1 Media asset fields present in code

| Field | Present | Required by schema | Basis | Notes |
|---|---|---|---|---|
| `assetType` | Yes | Optional with default-ish normalization | Code | Enum currently only `image` |
| `storageKey` | Yes | Optional in schema, but readiness requires it | Code | Storage pointer |
| `mimeType` | Yes | Optional | Code | Technical metadata |
| `originalFilename` | Yes | Optional | Code | Technical metadata |
| `title` | Yes | Optional | Code | Human title |
| `alt` | Yes | Optional | Code | Editorial/SEO-adjacent |
| `caption` | Yes | Optional | Code | Editorial display text |
| `ownershipNote` | Yes | Optional | Code | Rights/provenance |
| `sourceNote` | Yes | Optional | Code | Provenance |
| `uploadedBy` | Yes | Optional | Code | Audit-ish metadata |
| `uploadedAt` | Yes | Optional | Code | Audit-ish metadata |
| `sizeBytes` | Yes | Optional | Code | Technical metadata |
| `status` | Yes | Optional | Code | `draft_asset` / `ready` |
| `filename` separate from `originalFilename` | No separate field | N/A | Code | Title is auto-derived from filename on upload |
| `dimensions` | No | No | Code | Missing |
| `focalPoint` | No | No | Code | Missing |
| `tags` | No | No | Code | Missing |
| `locale` | On entity row, not payload | Entity-level | DB migration | Not surfaced as media-specific field |
| `seo` | No in schema | No | Code | Important mismatch with current UI |

### 5.2 Gallery fields present in code

| Field | Present | Basis | Notes |
|---|---|---|---|
| `title` | Yes | Schema | Primary display label |
| `primaryAssetId` | Yes | Schema | Semantically sensitive field |
| `assetIds` | Yes | Schema | Ordered list behavior implied |
| `caption` | Yes | Schema | Editorial summary |
| `relatedEntityIds` | Yes | Schema | Not obviously surfaced well in current UI |
| `seo` | Yes | Schema + normalization | Gallery has real SEO persistence |

### 5.3 Revision/history semantics

Media does not currently live in a simpler CRUD path. It uses the same versioning/revision posture as other content entities:
- draft save path
- `changeIntent`
- audit events
- published version sidebar support

This is an important product/technical truth. A future media gallery redesign should not accidentally assume media is a flat file table with direct overwrite semantics.

**Basis**
- FACT from repository/service layer: `lib/content-core/repository.js`, `lib/content-core/service.js`
- FACT from DB migration: `content_revisions.change_intent`

### 5.4 Current upload flow

Current upload flow:
1. Editor opens media detail/new screen.
2. Quick upload form posts multipart file to `app/api/admin/media/upload/route.js`.
3. Backend generates `storageKey` and stores bytes via `storeMediaFile()`.
4. Backend creates or updates `media_asset` draft revision with metadata.
5. Backend redirects to the new entity detail page.
6. Admin preview reads bytes via authenticated preview route.

This is simpler than the documented upload-slot/finalize lifecycle.

**Basis**
- FACT from route code: `app/api/admin/media/upload/route.js`
- FACT from storage adapter: `lib/media/storage.js`

### 5.5 Storage and delivery

Current storage/delivery truth:
- binary uploads go to the storage adapter (`local` or `s3` mode)
- metadata goes to SQL/content revisions
- public URL is derived from `MEDIA_PUBLIC_BASE_URL/<storageKey>` in `s3` mode
- admin preview can bypass CDN and read the object directly through backend storage access

**Basis**
- FACT from `lib/media/storage.js`
- FACT from `app/api/media/[entityId]/route.js`
- FACT from `app/api/admin/media/[entityId]/preview/route.js`

### 5.6 Image processing / optimization / variants

Current code does not show:
- thumbnail pipeline
- responsive image variants
- image dimension extraction
- crop/focal point model
- deduplication/checksum flow
- explicit max-size validation beyond what the server/runtime may impose

**Basis**
- FACT from code inspection: not found in `lib/media/*`, upload route, admin UI
- OPEN QUESTION whether some provider/CDN layer adds generic optimization outside app contracts

## 6. SEO/editorial metadata findings

### 6.1 What is clearly editorially important today

Likely high-value media metadata for editorial/SEO operator in the current system:
- `title`
- `alt`
- `caption`
- `ownershipNote`
- `sourceNote`
- preview of the actual image
- visibility into whether the file is reusable in services/cases/pages/galleries

**Basis**
- FACT from current fields and readiness rules
- INFERENCE from role definition and media reuse model

### 6.2 What is explicitly SEO-adjacent in code

Current explicit SEO-adjacent pieces:
- `alt` on `media_asset`
- generic SEO fields rendered by the shared form machinery (`metaTitle`, `metaDescription`, `canonicalIntent`, `indexationFlag`, `openGraphTitle`, `openGraphDescription`, hidden `openGraphImageAssetId`)

### 6.3 Critical conflict: visible SEO fields on media do not match persistence contract

The current media screen visibly renders generic SEO fields because the shared editor form renders them. But `media_assetSchema` does not define `seo`, and `normalizeEntityInput()` for media assets does not preserve generic SEO payload.

That means the user can currently see and edit SEO-looking inputs on the media screen, but those fields are not a confirmed persistent contract for `media_asset`.

**Basis**
- FACT from `components/admin/EntityEditorForm.js`
- FACT from `app/api/admin/entities/[entityType]/save/route.js`
- FACT from `lib/content-core/pure.js`
- FACT from `lib/content-core/schemas.js`

**Engineering interpretation**
- This is not a minor copy issue.
- This is a DTO/UI leakage problem.
- Any future media-gallery PRD must explicitly decide whether media assets genuinely own SEO metadata beyond `alt`, or whether those generic fields must disappear from media.

### 6.4 Gallery SEO is real

Unlike media assets, galleries do have persisted SEO contract today.

**Basis**
- FACT from `gallerySchema` in `lib/content-core/schemas.js`
- FACT from `normalizeEntityInput()` in `lib/content-core/pure.js`

## 7. UX friction and operator pain points

### 7.1 Current screen is form-first, not library-first

The current screen prioritizes revision editing over visual browsing. For a media operator this creates friction because the natural mental model is:
- see assets visually
- pick current asset
- edit metadata around that asset
- reuse across content

Current as-is instead feels like:
- open generic entity card
- upload a file
- edit a long form
- go elsewhere to reuse it

**Basis**
- FACT from live UI and `EntityEditorForm.js`

### 7.2 List page is not a gallery surface

Media list lacks:
- visual thumbnail grid
- list filters
- sorting controls
- bulk actions
- explicit recent uploads / recently used / unused / missing-alt views

This is one of the strongest reasons the current screen does not yet feel like a native media gallery.

### 7.3 Draft media is not naturally reusable

`MediaPicker` and gallery options are populated from published cards only, while upload creates draft media revisions. This creates a serious operator mismatch:
- user uploads a new asset
- but may not be able to pick it immediately in downstream entity editors

**Basis**
- FACT from `lib/admin/entity-ui.js`
- FACT from upload flow in `app/api/admin/media/upload/route.js`

### 7.4 Usage visibility is weak

`whereUsedLabel` is currently hardcoded to `Пока не используется`. Real dependency visibility is not surfaced.

That means operators cannot easily answer:
- where is this asset used?
- is it safe to replace or archive?
- which pages/services/cases depend on it?

**Basis**
- FACT from `lib/admin/entity-ui.js`

### 7.5 Gallery semantics are still partially awkward

Current gallery screen already separates group membership and primary asset, but `Основной файл` remains semantically sensitive. It may be a useful concept, but it is not yet self-explanatory from the UI alone.

**Basis**
- FACT from current gallery form
- FACT from prior UX notes in `docs/product-ux/EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md`

### 7.6 Test/probe content distorts UX judgment

Live media/galleries have been affected by probe/test records during recent infra work. Even though an internal cleanup tool now exists, visual and operational judgment about the media surface can be skewed unless test data is cleaned before evaluation.

**Basis**
- FACT from live runtime observations
- FACT from cleanup tool/docs in `scripts/cleanup-test-data.mjs` and `docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md`

## 8. Conflicts and ambiguities (docs vs code, code vs intent, etc.)

| Conflict / ambiguity | Type | Basis | Why it matters |
|---|---|---|---|
| Docs describe richer upload/finalize/archive/quarantine lifecycle; code uses direct upload + simple ready state | Docs vs code | `Media_Storage_Operations_Spec` vs `app/api/admin/media/upload/route.js`, `schemas.js` | Future PRD must decide whether to grow toward spec or re-baseline docs |
| Docs imply broader media domain; code only supports `image` | Docs vs code | Media docs vs `mediaAssetSchema.assetType` | A gallery redesign should not silently assume video/document support |
| Media UI shows generic SEO fields; media schema does not persist them | Code vs UI contract | `EntityEditorForm.js`, `pure.js`, `schemas.js` | Most important current mismatch |
| Pickers use published assets/galleries; upload creates draft asset | Workflow mismatch | `entity-ui.js`, upload route | Reuse friction for editors |
| Docs/MVP expect admin lists to be operational; current media list lacks filter/search/sort/bulk | Docs vs UI | MVP docs vs list route | Impacts gallery-first redesign baseline |
| Future idea says “metadata on the right”; shell canon says right rail is support-only | Intent vs fixed canon | User intent + carryovers plan | Needs careful layout interpretation, not direct literal translation |
| CDN/public delivery path is real architecture, but current infra can be degraded independently of admin preview | Delivery ambiguity | storage/docs/live infra | Redesign must not assume preview == public delivery |

## 9. Constraints for future media gallery redesign

1. Do not reopen shell canon.
   - Left sidebar remains global navigation.
   - Top breadcrumb/depth remains nested navigation.
   - Right rail remains support/status/history.

2. Do not collapse `media_asset` and `gallery` into one concept without explicit product decision.

3. Do not assume enterprise DAM scope.
   - No evidence yet for tags taxonomies, bulk moderation pipelines, focal-point tooling, AI auto-tagging, etc.

4. Do not assume non-image media support.
   - Current code is image-only.

5. Keep version/revision semantics in view.
   - Media is not just a dumb file row.

6. Treat SEO fields on media as unresolved.
   - They are not currently a reliable contract.

7. Keep upload/manage/reuse tightly connected.
   - A gallery-first redesign that still forces the user into published-only reuse would miss a key workflow pain.

8. Respect storage/delivery split.
   - Admin preview, origin storage, and public CDN delivery are different concerns.

9. Expect scale/performance follow-up if list surfaces become visual grids.
   - Current picker/search approach is in-memory and list-based.

## 10. Open questions / decisions needed

### Product decisions needed
- Should `media_asset` own real SEO metadata beyond `alt`, or should generic SEO fields disappear from media entirely?
- Should newly uploaded draft media be reusable immediately in entity editors, or is published-only reuse intentional?
- Is `gallery` still the right reusable composition boundary, or should the future media screen subsume some gallery tasks while keeping gallery as entity truth?
- What exactly is the intended role of `primaryAssetId` in gallery: cover, default preview, or canonical first image?
- Does phase 1 need visual-only library browse, or also search/filter/sort/bulk editing?

### Technical decisions needed
- Should the documented upload/finalize lifecycle remain a target, or is the direct-upload route the actual intended long-term contract?
- Should media storage metadata grow to include dimensions, checksum, and variants?
- Should where-used visibility become a first-class derived field/service?
- Should pickers/query APIs be widened from published-only to operator-facing draft/latest cards?

### UX decisions needed
- Where exactly should “expanded current-item editor” live if the main intention is gallery-like browse above and large item editing below, while the right rail remains support-only?
- How much metadata belongs inline with the selected media item versus in secondary collapsible panels?
- Which fields are primary for daily SEO/editorial work, and which should be secondary/advanced?

## 11. Additional context I believe the next step needs

1. **Media preview and public delivery are separate systems.**
   Admin preview can work even when CDN/public delivery is degraded. Any redesign should model them separately.

2. **The current app already has a real storage-health dependency.**
   The shell now exposes compact infra health (`S3`, `CDN`) because media work is operationally sensitive to storage/delivery state.

3. **Probe/test content can mislead design discussions.**
   There is now an internal cleanup tool for test/probe content:
   - `scripts/cleanup-test-data.mjs`
   - `scripts/cleanup-test-data-runtime.sh`
   This should be used before serious UX evaluation sessions.

4. **The shared editor form is currently leaking generic capabilities into media.**
   The media screen is partly shaped by generic entity-editor infrastructure. This is convenient, but it also causes DTO leakage (notably SEO fields).

5. **Current picker/search model may not scale to gallery-first UI without new query contracts.**
   `MediaPicker` performs in-memory filtering on already-loaded assets. A visual gallery with larger volumes may need server-backed search/filter/pagination.

6. **Real reuse opportunity exists.**
   The current system already has:
   - preview URLs
   - separate gallery entity
   - reusable media picker component
   - read-side expansion of gallery assets
   A future gallery redesign can reuse these foundations instead of inventing a brand-new media subsystem.

7. **There is risk of over-reading the current screen as final product truth.**
   Some current awkwardness comes from generic admin entity scaffolding, not from a deeply intentional media-specific design.

## 12. Concrete appendix

### 12.1 Key files

#### Product/docs
- `docs/product-ux/Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/Admin_Content_Contract_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`
- `docs/product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`
- `docs/product-ux/EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md`
- `docs/product-ux/EKOSTROY.UI.VERSTKA_PENDING_CARRYOVERS_PLAN_Экостройконтинент_v0.1.md`
- `docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md`
- `docs/selectel/PRD.Infrastructure_Baseline_Экостройконтинент_v0.1.md`
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`

#### Code: domain/model/storage
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/content-core/repository.js`
- `lib/content-core/service.js`
- `lib/content-core/content-types.js`
- `lib/content-ops/readiness.js`
- `lib/media/storage.js`
- `lib/config.js`

#### Code: admin UI/routes
- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/MediaPicker.js`
- `lib/admin/entity-ui.js`
- `lib/admin/screen-copy.js`
- `components/admin/AdminShell.js`
- `components/admin/admin-ui.module.css`
- `lib/admin/infra-health.js`

#### Code: APIs
- `app/api/admin/media/upload/route.js`
- `app/api/admin/media/[entityId]/preview/route.js`
- `app/api/admin/entities/[entityType]/save/route.js`
- `app/api/media/[entityId]/route.js`
- `app/api/media-public/[entityId]/route.js`

#### Public read-side/rendering
- `lib/read-side/public-content.js`
- `components/public/PublicRenderers.js`

#### DB
- `db/migrations/001_admin_first_slice.sql`

### 12.2 Key components and their current role

| Component | Current role | Notes |
|---|---|---|
| `EntityEditorForm` | Shared editor for all core entities | Media inherits generic entity behavior from here |
| `MediaPicker` | Reuse/select existing media in other editors | Search-only, list-based, no upload inline |
| `AdminShell` | Shared admin shell | Important because right rail meaning is fixed |
| `SurfacePacket` / rail/status sections | Status/support context | Future redesign should respect this grammar |

### 12.3 Key endpoints/services

| Endpoint/service | Purpose | Notes |
|---|---|---|
| `POST /api/admin/media/upload` | Upload media binary + create draft asset | Direct upload path |
| `GET /api/admin/media/[entityId]/preview` | Authenticated preview | Reads directly from storage |
| `POST /api/admin/entities/[entityType]/save` | Save editor payload | Shared route used by media detail edits |
| `GET /api/media/[entityId]` | Public delivery indirection | In s3 mode redirects to public delivery URL |
| `GET /api/media-public/[entityId]` | Backend-streamed public path | Transitional/fallback-like path |
| `storeMediaFile/readMediaFile/deleteMediaFile` | Storage adapter operations | Implemented in `lib/media/storage.js` |

### 12.4 Key DB tables/models

| Table/model | Purpose | Notes |
|---|---|---|
| `content_entities` | Stable entity identity and type | Includes `media_asset`, `gallery`; locale lives here |
| `content_revisions` | Revision payloads and change intent | Real source of latest metadata truth |
| `audit_events` | Human-readable operator history | Shared across entities |
| `publish_obligations` | Publish-time operational obligations | Relevant downstream when media is referenced |

## Closing note

The next step should not start from a blank “design a beautiful gallery” prompt. It should start from this concrete as-is truth:
- the project already has a real media domain,
- the biggest current friction is workflow and contract mismatch rather than absence of entities,
- and the most dangerous unresolved area is the false/ambiguous SEO contract on `media_asset`.

That gives a strong, bounded base for a focused PRD / UX brief for a future gallery-oriented media screen.
