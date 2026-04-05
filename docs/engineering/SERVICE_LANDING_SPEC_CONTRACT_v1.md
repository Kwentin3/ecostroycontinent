# SERVICE_LANDING_SPEC_CONTRACT_v1

## Purpose

This contract defines the engineering shape of a service landing candidate for the first rollout of the landing factory.

It is service-only. It targets `/services/[slug]` only.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| The candidate/spec shape, required fields, allowed refs, SEO fields, and source context expectations. | Render implementation, publish workflow, block registry details, other route families. | The current `service` revision payload remains the canonical truth holder. | New truth stores, arbitrary HTML/JSX, page-builder semantics, route-family expansion. |

## Relationship to the current revision payload

`Landing Spec` is a formal contract view of the existing structured service revision payload.

It is not a second source of truth.

The canonical service revision payload remains the write-side content record. The spec is the factory-facing interpretation used for candidate creation, validation, preview, and approval.

## Contract shape

### Spec metadata

| Field | Status | Notes |
|---|---|---|
| `specVersion` | Required | Factory contract version. |
| `candidateId` | Required | Stable identifier for the generated candidate. |
| `baseRevisionId` | Required | The service revision the candidate is derived from. |
| `routeFamily` | Required | Fixed to `service`. |
| `variantKey` | Optional | Human-readable variant marker for comparison. |
| `sourceContextSummary` | Required | Short trace of the brief and proof basis used to create the candidate. |

### Mirrored service payload fields

| Field | Status | Notes |
|---|---|---|
| `slug` | Required | Must resolve to `/services/[slug]`. |
| `title` | Required | Entity title. |
| `h1` | Required | Public heading. |
| `summary` | Required | Intro copy for the service page. |
| `serviceScope` | Required | Core service explanation. |
| `problemsSolved` | Allowed | Optional service detail. |
| `methods` | Allowed | Optional service detail. |
| `ctaVariant` | Required | CTA text or variant used by the service surface. |
| `primaryMediaAssetId` | Allowed | Required for publish-ready approval if the verification contract marks it as a blocker. |
| `relatedCaseIds` | Allowed | Must reference published cases when present. |
| `galleryIds` | Allowed | Must reference published galleries when present. |

### SEO fields

| Field | Status | Notes |
|---|---|---|
| `seo.metaTitle` | Required | Publish-ready service SEO title. |
| `seo.metaDescription` | Required | Publish-ready service description. |
| `seo.canonicalIntent` | Required | Must be explicit. |
| `seo.indexationFlag` | Required | `index` or `noindex`. |
| `seo.openGraphTitle` | Allowed | Optional. |
| `seo.openGraphDescription` | Allowed | Optional. |
| `seo.openGraphImageAssetId` | Allowed | Optional, but must reference a published media asset when used. |

## Allowed references

Only references that can be resolved against current runtime truth are allowed in the first rollout:

- `primaryMediaAssetId` -> `MediaAsset`
- `relatedCaseIds` -> `Case`
- `galleryIds` -> `Gallery`
- `baseRevisionId` -> existing service revision

No article, FAQ, review, or non-service route references are allowed in this contract.

## Source context expectations

The candidate must state, in compact form, what it was generated from:

- owner brief or task
- existing service revision snapshot
- selected published proof material
- SEO intent or target query
- variant intent, if any

If the source context cannot be stated clearly, the candidate is not ready for verification.

## Explicit exclusions

- `page.blocks[]` from the standalone page model
- `hero` from the page block union
- `faq_list`
- article, FAQ, and review payloads
- homepage fields
- custom HTML or JSX
- route-family expansion beyond services

## Contract rule

Any field not listed above is out of contract for v1 unless it already exists in the current service revision payload and is explicitly required by the verification contract.

