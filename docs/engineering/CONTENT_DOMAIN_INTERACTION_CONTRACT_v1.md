# CONTENT_DOMAIN_INTERACTION_CONTRACT_v1

## Status

Canonical engineering contract / refactor anchor

## Purpose

This document consolidates the current runtime contract for how the main content domains interact:

- `service`
- `equipment`
- `case`
- `media_asset`
- `gallery`
- `page`
- `global_settings`

It exists so refactors do not have to rediscover domain boundaries by reading UI behavior alone.

This contract does not replace the workflow and publish docs. It narrows one specific question:

- who owns which truth;
- which cross-domain references are allowed;
- where published-only discipline is enforced;
- how draft vs live state must coexist.

## Primary rule

Source entities own reusable truth and facts. `page` owns composition. It does not own source truth.

This matches the existing product and implementation canon:

- source entities own reusable truth;
- page composition consumes source truth;
- public read-side resolves published truth only;
- editing creates or updates a working revision and must not mutate live truth in place.

## Domain ownership

### `global_settings`

Owns site-wide public brand and contact truth used as a published fallback across public routes.

### `media_asset`

Owns atomic media truth:

- storage identity
- title / alt / caption
- ownership and source notes

It does not own page, service, case, or gallery composition.

### `gallery`

Owns ordered media collection truth:

- `assetIds`
- `primaryAssetId`
- gallery-local caption

It may group published media assets, but it is not a second media store.

### `service`

Owns reusable service truth:

- service identity and route slug
- commercial summary
- service scope
- CTA baseline
- proof references

### `equipment`

Owns reusable machine truth:

- equipment identity and route slug
- equipment type
- short and capability summaries
- key specs
- usage scenarios
- related proof and service context

### `case`

Owns reusable proof truth:

- case identity and route slug
- location and task context
- work scope
- result
- linked proof and context entities

### `page`

Owns page composition and page-local routing context:

- `pageType`
- page slug
- composition structure
- `sourceRefs`
- targeting
- page-local SEO

`page` may reference source truth. It must not silently absorb and become the owner of service, equipment, case, gallery, or media facts.

## Allowed cross-domain references

The executable reference registry lives in `lib/content-core/entity-references.js`. Payload shape lives in `lib/content-core/schemas.js`.

Current allowed relations are:

| Owner | Fields | Allowed targets |
| --- | --- | --- |
| `gallery` | `primaryAssetId`, `assetIds` | `media_asset` |
| `service` | `primaryMediaAssetId`, `equipmentIds`, `relatedCaseIds`, `galleryIds` | `media_asset`, `equipment`, `case`, `gallery` |
| `equipment` | `primaryMediaAssetId`, `serviceIds`, `relatedCaseIds`/`caseIds`, `galleryIds` | `media_asset`, `service`, `case`, `gallery` |
| `case` | `primaryMediaAssetId`, `serviceIds`, `equipmentIds`, `galleryIds` | `media_asset`, `service`, `equipment`, `gallery` |
| `page` | `primaryMediaAssetId`, `sourceRefs.primaryServiceId`, `sourceRefs.primaryEquipmentId`, `sourceRefs.caseIds`, `sourceRefs.galleryIds`, selected legacy block refs | `media_asset`, `service`, `equipment`, `case`, `gallery` |

`media_asset` and `global_settings` do not own outbound content-domain references in the current contract.

## Draft vs live contract

One entity may legitimately have both:

- an `activePublishedRevision`; and
- a newer working revision in `draft` or `review`.

This is not a collision. It is the intended model.

Therefore:

- `Опубликовано` is a live-state marker, not an edit lock;
- editing must create or update the working revision;
- public routes must continue to read the published revision until a new publish happens.

The canonical runtime seam for this behavior is:

- `lib/content-core/service.js`
- `lib/content-core/repository.js`

## Published-only read-side contract

Public routes must resolve cross-domain data from published lookups only.

Canonical read-side helpers:

- `lib/read-side/public-content.js`
- route readers such as `app/services/[slug]/page.js`

This means:

- public services resolve published cases, equipment, galleries, and media only;
- draft or review references must never leak into public composition through convenience helpers;
- preview is a separate surface and may read working state explicitly.

## Publish-readiness contract

Publish gating is the place where cross-domain references become enforceable business rules rather than just schema shape.

Canonical gate:

- `lib/content-ops/readiness.js`

Current runtime discipline includes:

- gallery assets must exist and be published before gallery publish;
- service proof refs must exist and be published before service publish;
- case proof refs must exist and be published before case publish;
- optional primary media refs must exist and be published before publish;
- page primary source requirements depend on `pageType`;
- page primary media must be published when present.

## Legacy compatibility note

`equipment` link resolution currently supports a narrow transitional fallback:

- explicit `service.equipmentIds`; or
- reverse lookup from equipment back to service / case when explicit `equipmentIds` are absent.

Canonical runtime seam:

- `lib/content-core/equipment-relations.js`

This compatibility path is allowed only as a bounded bridge. It must not become a license for broad bidirectional truth duplication.

## Current gaps to keep visible during refactor

These are important because schema and reference collection are slightly ahead of readiness in a few places:

1. `equipment` payload allows `serviceIds`, `relatedCaseIds`, and `galleryIds`, but readiness currently gates only the minimum equipment fields and optional primary media.
2. `page` payload allows `sourceRefs.caseIds` and `sourceRefs.galleryIds`, and `entity-references.js` collects them, but page readiness currently does not validate those refs the same way it validates primary source and primary media.
3. Public service rendering still carries the compatibility path from reverse equipment links when explicit `equipmentIds` are absent.

These are not reasons to invent UI shortcuts. They are explicit refactor targets.

## Change protocol

Any change to cross-domain relations must update the contract as one unit:

1. payload shape in `lib/content-core/schemas.js`
2. executable reference registry in `lib/content-core/entity-references.js`
3. draft / live behavior when needed in `lib/content-core/service.js` and repository helpers
4. publish gating in `lib/content-ops/readiness.js`
5. public lookup behavior in `lib/read-side/public-content.js`
6. compatibility helpers such as `lib/content-core/equipment-relations.js` when relevant

If only one layer changes, the refactor is incomplete.

## Refactor guardrails

- Do not copy source truth into `page` just because the page wants to render it.
- Do not add new cross-domain IDs only in UI code.
- Do not let public helpers read draft or review state by accident.
- Do not treat `published` as an edit lock.
- Do not expand compatibility fallbacks without documenting the new boundary here.

## Recommended read order for future refactors

1. This document
2. `lib/content-core/content-types.js`
3. `lib/content-core/schemas.js`
4. `lib/content-core/entity-references.js`
5. `lib/content-core/service.js`
6. `lib/content-ops/readiness.js`
7. `lib/read-side/public-content.js`
8. Relevant route reader or workspace file
