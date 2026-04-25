# ADMIN_CONTENT_LANDSCAPE_ZERO_CONTEXT_MAP_v1

## Status

Zero-context entry map / current runtime anchor

## Purpose

Use this document before any refactor or bugfix that touches admin content workflow, review, publication, cross-domain references, or public read-side behavior.

It exists for the "new chat with no context" situation. It answers five questions quickly:

- what the main domains are;
- where review stops and publish starts;
- where live state is projected;
- which files are the real seams;
- which operational limits matter for verification.

This document is not a replacement for the deeper domain contract. Read this first, then continue with `docs/engineering/CONTENT_DOMAIN_INTERACTION_CONTRACT_v1.md`.

## Fast mental model

- Source entities own reusable truth. `page` owns composition.
- `equipment` is a first-class source domain, not a decorative attachment to services or cases.
- `media_asset` is a first-class source domain too. Other entities may reference published media, but they do not own media truth.
- Review and publish are separate operations.
- Approval and publish are separate operations.
- One entity may have both an active published revision and a newer working revision at the same time.
- `published` is a live-state marker, not an edit lock.
- Direct publish / unpublish belongs to the entity surface, not to `/admin/review`.
- Business owner approves or returns content. SEO/editorial roles prepare content and send it to review. Publish authority stays on the publishing surface.

## User stories that must stay true

### SEO / editor workflow

1. Create a new entity or edit an existing one as a working revision.
2. Send the revision to review.
3. Receive approval or return-with-comments on the review surface.
4. After approval, publish from the entity card.
5. If the entity is already live, publish changes as a separate explicit action that replaces the live revision.
6. If needed, remove the entity from live without destroying the working history.

### Business owner workflow

1. Open the review surface to inspect candidate content.
2. Approve or return with comments.
3. Do not own the publish step.
4. Do not need to understand deploy mechanics to perform approval.

### Published-with-pending-changes workflow

1. A published entity may be edited again.
2. The live revision remains active while the new draft or review revision is prepared.
3. After approval, the action is "publish changes", not "create live state automatically".
4. Until that explicit publish happens, public routes must continue reading the active published revision.

## Domain map

| Domain | Owns | Common consumers | Key runtime seams |
| --- | --- | --- | --- |
| `media_asset` | file identity, alt, caption, ownership/source notes | `gallery`, `service`, `equipment`, `case`, `page` | `lib/admin/media-gallery.js`, `lib/content-ops/readiness.js`, `lib/read-side/public-content.js` |
| `gallery` | ordered media collection truth | `service`, `equipment`, `case`, `page` | `lib/content-core/entity-references.js`, `lib/content-ops/readiness.js` |
| `service` | reusable service truth | `page`, public service routes, related `case`/`equipment` | `lib/content-core/schemas.js`, `lib/content-ops/readiness.js`, `lib/read-side/public-content.js` |
| `equipment` | reusable machine truth | `service`, `case`, `page` | `lib/content-core/equipment-relations.js`, `lib/content-core/entity-references.js`, `lib/content-ops/readiness.js` |
| `case` | reusable proof truth | `service`, `page`, public proof blocks | `lib/content-core/entity-references.js`, `lib/content-ops/readiness.js`, `lib/read-side/public-content.js` |
| `page` | page composition, routing context, page-local SEO | public routes | `lib/admin/page-workspace.js`, `lib/content-ops/readiness.js`, `lib/read-side/public-content.js` |
| `global_settings` | site-wide brand/contact truth | public shell, contacts page | `lib/content-ops/readiness.js`, `lib/read-side/public-content.js` |

For deeper ownership and allowed reference rules, continue with `docs/engineering/CONTENT_DOMAIN_INTERACTION_CONTRACT_v1.md`.

## Workflow split that must not drift

### Review lane

- Purpose: approval / return / owner decision.
- Main UI seam: `app/admin/(console)/review/page.js`
- Card projection seam: `lib/admin/owner-review.js`
- Review queue source: `lib/content-ops/workflow.js`

Important interpretation:

- review status answers "where is the candidate revision in the review lane?"
- review status does not answer "is this entity currently live?"
- entering the review lane does not always mean the operator should stay on the review screen
- when owner approval is not required, submit may return the operator to the source card already in `Ready to publish`

If a review card says `approved`, that means approval was obtained for the candidate revision. It does not mean the candidate revision is already published.

### Publish lane

- Purpose: explicit live-state transition.
- Main status seam: `lib/admin/workflow-status.js`
- Entity actions seam: `components/admin/EntityEditorForm.js`
- Media surface seam: `components/admin/MediaGalleryWorkspace.js`
- Publish screen seam: `app/admin/(console)/revisions/[revisionId]/publish/page.js`
- Live removal seam: `app/admin/(console)/entities/[entityType]/[entityId]/live-deactivation/page.js`

Important interpretation:

- publish answers "which revision is the live public truth now?"
- publish does not happen as a side effect of review approval
- removing from live also belongs to the entity surface, not to the review queue

## Two-axis status model

The admin UI intentionally projects content state on two separate axes:

1. working revision state
2. live publication state

Typical examples:

- `Draft` + `Not published`
- `Owner review` + `Published`
- `Ready to publish` + `Published`
- `No changes` + `Published`

This is why a card may be "approved" or "ready to publish" and still not be live, and why a published card may still be editable through a new draft.

The canonical status projection lives in `lib/admin/workflow-status.js`.

## High-risk seams to read before editing

| Question | Read here first | Why it matters |
| --- | --- | --- |
| How are working/live badges calculated? | `lib/admin/workflow-status.js` | This is the canonical two-axis projection. |
| Why does the review screen show approved items that are not live? | `lib/admin/owner-review.js`, `app/admin/(console)/review/page.js` | Review queue is about approval state, not live state. |
| Why does submit sometimes return to the card instead of opening review? | `app/api/admin/revisions/[revisionId]/submit/route.js` | Non-owner review flows should continue from the source entity once the revision is already publish-ready. |
| Where do publish / unpublish actions belong? | `components/admin/EntityEditorForm.js`, `components/admin/MediaGalleryWorkspace.js` | Entity surfaces own live transitions. |
| Which cross-domain references are valid? | `lib/content-core/entity-references.js`, `lib/content-core/schemas.js` | Schema and executable reference collection must stay aligned. |
| Which references must be published before publish? | `lib/content-ops/readiness.js` | Publish-time business rules live here. |
| What may public routes consume? | `lib/read-side/public-content.js` | Public read-side must resolve published truth only. |
| Why does equipment sometimes resolve through a fallback path? | `lib/content-core/equipment-relations.js` | Transitional compatibility exists and must not silently expand. |

## Fast code-search anchors

If you start from the terminal, these symbols recover the right landscape quickly:

- `getWorkingRevisionStatusModel`
- `getLivePublicationStatusModel`
- `getPublishActionCopy`
- `getOwnerReviewStatusModel`
- `buildOwnerReviewGalleryCards`
- `canOpenPublishReadiness`
- `collectEntityReferenceRecords`
- `evaluateReadiness`
- `buildPublishedLookups`
- `resolveEquipmentIdsForEntity`

## Operational reality for verification

- End-to-end workflow questions cannot rely only on local code reading.
- The repository does not guarantee full local parity for every operator machine and every workflow stage.
- Local Docker / compose availability has historically been a moving constraint on this project.
- For live workflow/UI questions, the normal path is: change locally, run tests/build, deliver, verify on the deployed admin with Playwright.

Relevant infra anchors:

- `docs/selectel/INFRA.AUDIT.ANAMNESIS_Экостройконтинент_v0.1.md`
- `docs/selectel/RUNTIME_DEPLOY_ARTIFACTS.IMPLEMENTATION_REPORT_Экостройконтинент_v0.1.md`

Do not invent a second "local-only" workflow truth to compensate for missing runtime context.

## Change protocol for future refactors

### If you change workflow semantics

Update as one unit:

1. `lib/admin/workflow-status.js`
2. `lib/admin/owner-review.js`
3. review page copy and filters in `app/admin/(console)/review/page.js`
4. entity/media action surfaces
5. discoverability tests in `tests/admin/*discoverability*.test.js`

### If you change cross-domain relations

Update as one unit:

1. `lib/content-core/schemas.js`
2. `lib/content-core/entity-references.js`
3. `lib/content-ops/readiness.js`
4. `lib/read-side/public-content.js`
5. `docs/engineering/CONTENT_DOMAIN_INTERACTION_CONTRACT_v1.md`

### If you change publish/readiness rules

Update as one unit:

1. readiness logic
2. entity-surface affordances
3. review/publish copy
4. tests that prove the change is visible to an operator

## Recommended read order

1. This document
2. `docs/engineering/CONTENT_DOMAIN_INTERACTION_CONTRACT_v1.md`
3. `docs/product-ux/Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md`
4. `docs/product-ux/Owner_Confirmation_Pack_Экостройконтинент_v0.1.md`
5. `lib/admin/workflow-status.js`
6. `lib/admin/owner-review.js`
7. `lib/content-ops/readiness.js`
8. `lib/read-side/public-content.js`
9. The specific workspace / route you are about to change

## Default guardrails

- Do not collapse review and publish back into one surface.
- Do not treat approved content as automatically live.
- Do not treat published content as locked against edits.
- Do not let public routes read draft or review state.
- Do not hide equipment as a secondary attachment if the task is about reusable source truth.
- Do not add relation rules only in UI code.
