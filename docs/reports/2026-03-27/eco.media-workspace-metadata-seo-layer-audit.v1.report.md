# ECO.MEDIA_WORKSPACE.METADATA_SEO_LAYER_AUDIT.V1

## 1. Executive summary

**FACT**: After the media + collections fold-in, the current `Media` workspace still preserves two distinct semantic layers:
- `MediaAsset` metadata layer for individual images.
- `Gallery / Collection` SEO and grouping layer for reusable collections.

**FACT**: The workspace now exposes these layers through separate UI surfaces:
- asset edit modal for `title`, `alt`, `caption`, `sourceNote`, `ownershipNote`;
- compact `В коллекциях` membership control inside the asset edit modal;
- collection overlay for `title`, `caption`, `assetIds`, `primaryAssetId`, and the SEO block (`metaTitle`, `metaDescription`, `canonicalIntent`, `indexationFlag`, `openGraphTitle`, `openGraphDescription`, `openGraphImageAssetId`).

**RISK**: The only meaningful weakness is not field leakage, but the save path shape for membership changes: media metadata save and collection membership sync are separate steps, so the operation is not fully atomic. The UI shows this honestly via warning handling, but it is still a persistence coupling risk.

**Conclusion**: The layers are preserved, with one operational caveat around non-atomic membership sync.

## 2. MediaAsset metadata layer - current truth

**FACT**: Canonical media asset fields in the current code/schema are:
- `assetType`
- `storageKey`
- `mimeType`
- `originalFilename`
- `title`
- `alt`
- `caption`
- `ownershipNote`
- `sourceNote`
- `uploadedBy`
- `uploadedAt`
- `sizeBytes`
- `status`
- `lifecycleState`

Basis:
- `lib/content-core/schemas.js` (`mediaAssetSchema`)
- `lib/content-core/schemas.js` (`getTopLevelFieldsForEntityType` for `media_asset`)

**FACT**: The live asset editor exposes the expected editable metadata fields:
- `title`
- `alt`
- `caption`
- `sourceNote`
- `ownershipNote`

Basis:
- `components/admin/MediaGalleryWorkspace.js`

**FACT**: `originalFilename` is treated as a system field, not as a user-editable metadata field.
- It is loaded into the asset UI.
- It is preserved on save.
- It is shown as filename context in the inspector and overlay.

Basis:
- `components/admin/MediaGalleryWorkspace.js`
- `app/api/admin/media/library/[entityId]/route.js`

**FACT**: There are no generic SEO fields on the asset edit surface.
- No `metaTitle`
- No `metaDescription`
- No `canonicalIntent`
- No `indexationFlag`
- No `openGraph*` fields

**ISSUE**: The asset edit modal does include a collection membership control, but that is a relation control, not a metadata field. The UI keeps this separate enough to avoid semantic leakage.

## 3. Collection/Gallery SEO layer - current truth

**FACT**: The collection schema still carries its own SEO subobject:
- `title`
- `primaryAssetId`
- `assetIds`
- `caption`
- `relatedEntityIds`
- `seo`

Basis:
- `lib/content-core/schemas.js` (`gallerySchema`)
- `lib/content-core/schemas.js` (`getTopLevelFieldsForEntityType` for `gallery`)

**FACT**: The collection overlay still exposes the full collection SEO contract:
- `metaTitle`
- `metaDescription`
- `canonicalIntent`
- `indexationFlag`
- `openGraphTitle`
- `openGraphDescription`
- `openGraphImageAssetId`

Basis:
- `components/admin/MediaCollectionOverlay.js`

**FACT**: The collection overlay also preserves the grouping semantics:
- `assetIds`
- `primaryAssetId`
- `caption`
- linked usage context

**FACT**: Collection SEO and collection membership are saved through the collection routes, not through the media asset route.

Basis:
- `app/api/admin/media/collections/create/route.js`
- `app/api/admin/media/collections/[entityId]/route.js`
- `lib/admin/media-collections.js`

**ISSUE**: The word `collection` now appears in both the asset editor and the collection editor, but with different meaning:
- asset editor: membership selection
- collection editor: real collection authoring, including SEO

This is a UI wording density issue, not a contract loss.

## 4. UI separation assessment

**FACT**: The new workspace keeps asset metadata and collection SEO on different surfaces.

Asset side:
- title / alt / caption / source / rights
- compact `В коллекциях` summary + checklist
- no SEO block

Collection side:
- title / caption / primary asset / asset list
- explicit `Дополнительно` disclosure for SEO fields
- usage section for the collection itself

**FACT**: The asset edit modal labels the membership control explicitly:
- `В коллекциях`
- helper text clarifies that only membership changes here, while collection composition and primary frame live in the collection editor.

**FACT**: The collection overlay uses a separate disclosure for SEO so those fields do not compete with the main collection composition controls.

**ISSUE**: The surfaces are semantically distinct, but visually dense. The current design is safe because the boundaries are explicit, not because the form is minimal.

## 5. Save/load/persistence assessment

**FACT**: Asset metadata persistence path is still honest.
- Load path: `getMediaLibraryCard` / `listMediaLibraryCards`
- Save path: `POST /api/admin/media/library/[entityId]`
- Save payload includes the asset fields only:
  - `title`
  - `alt`
  - `caption`
  - `sourceNote`
  - `ownershipNote`
  - plus binary/storage metadata carried forward

Basis:
- `app/api/admin/media/library/[entityId]/route.js`
- `lib/admin/media-gallery.js`

**FACT**: Collection SEO persistence path is still honest.
- Load path: `getCollectionLibraryCard` / collection DTO
- Save path: `POST /api/admin/media/collections/create`
- Update path: `POST /api/admin/media/collections/[entityId]`
- Payload includes `seo` subfields and grouping fields

Basis:
- `app/api/admin/media/collections/create/route.js`
- `app/api/admin/media/collections/[entityId]/route.js`
- `lib/admin/media-collections.js`

**FACT**: Asset edit modal membership changes are persisted by a separate server-side sync step after the asset save.
- The asset save route accepts `collectionsTouched` + `collectionIds`.
- The route calls `syncAssetCollectionMembership`.
- The route returns `warning` if membership sync fails.

Basis:
- `app/api/admin/media/library/[entityId]/route.js`
- `lib/admin/media-collection-membership.js`

**RISK**: Membership sync is not transactional with the asset save.
- Media metadata can save successfully.
- Collection membership sync can still fail.
- The UI will show a warning instead of hard failing the whole action.

This is acceptable for operator UX, but it is a real persistence coupling to keep in mind.

**FACT**: No media-level SEO fields are persisted by the asset save route.

**FACT**: No media asset metadata fields are persisted through the collection overlay.

That split is correct and current.

## 6. Regressions or drift found

**FACT**: No canonical media metadata fields were lost from `MediaAsset`.

**FACT**: No canonical collection SEO fields were lost from `Gallery`.

**FACT**: No generic SEO leakage reappeared on the asset edit modal.

**FACT**: The asset edit modal now contains a membership block, but it is relation-only and does not imply collection SEO ownership.

**RISK**: Because the collection overlay and asset edit modal both talk about collections, future edits could accidentally blur the distinction if the labels are changed carelessly.

**RISK**: The current save flow for membership changes is best-effort, not atomic. That is not a semantic leak, but it is a drift vector for future refactors.

## 7. What is safe / what is risky

**Safe**
- Asset metadata fields are preserved and editable.
- `originalFilename` remains a system field, not a user-authored SEO field.
- Collection SEO fields remain on the collection surface only.
- Collection membership is visible in the asset modal without introducing generic SEO leakage.

**Risky**
- The membership sync path is separate from the asset save path.
- The UI is dense enough that future renaming could collapse the distinction between asset metadata and collection SEO.
- Collection operations still sit on a separate editor surface, so if later work tries to “simplify” too aggressively, it could accidentally fold SEO into the wrong layer.

## 8. Recommendations

**RECOMMENDATION**: Keep the current layer split exactly as-is:
- asset edit modal for media metadata + membership summary;
- collection overlay for grouping + SEO.

**RECOMMENDATION**: Keep `originalFilename` visually present but read-only in the asset flow.

**RECOMMENDATION**: Preserve the explicit helper text that says membership changes in the asset modal do not replace collection composition / primary frame editing.

**RECOMMENDATION**: If membership persistence is hardened later, do it as a dedicated persistence improvement, not by merging the UI layers.

**RECOMMENDATION**: Do not reintroduce generic SEO fields into the asset modal unless the underlying contract is intentionally expanded.

## 9. Final conclusion

**Final conclusion**: `metadata/SEO layers preserved with issues`

Why:
- preserved: yes, both layers are still present and correctly routed;
- issues: the membership update is not atomic with the asset save, and the UI uses the word `collection` in two related but different senses;
- leakage: no meaningful contract leakage found.

## Appendix - key files

**Media asset workspace**
- `components/admin/MediaGalleryWorkspace.js`
- `components/admin/admin-ui.module.css`

**Collection editor**
- `components/admin/MediaCollectionOverlay.js`

**Asset persistence**
- `app/api/admin/media/library/[entityId]/route.js`

**Collection persistence**
- `app/api/admin/media/collections/create/route.js`
- `app/api/admin/media/collections/[entityId]/route.js`

**Domain helpers**
- `lib/admin/media-gallery.js`
- `lib/admin/media-collections.js`
- `lib/admin/media-collection-membership.js`

**Canonical schema / contract**
- `lib/content-core/schemas.js`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Media_Storage_Operations_Spec_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_UI_Capability_Inventory_Экостройконтинент_v0.1.md`

**Live verification basis**
- Playwright verification on the live `/admin/entities/media_asset` workspace in this session:
  - asset edit modal showed `title`, `alt`, `caption`, `sourceNote`, `ownershipNote`
  - `В коллекциях` membership control was present and functional
  - collection overlay retained the `Дополнительно` SEO disclosure
