# LANDING_COMPOSITION_SPEC_CONTRACT_v1

## Purpose

This contract defines the engineering shape of the landing-first composition draft used by the AI-assisted workspace.

It is the primary contract for one-page composition work built from existing structured entities and assets. It is not a generic page builder and it is not autonomous publish.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Landing draft shape, allowed references, composition ordering, source context expectations, workspace-facing spec metadata, and the target `Page` owner for publish. | Render implementation, publish workflow, arbitrary page-builder semantics, route ownership truth. | Canonical content stays in Content Core; `Page` is the durable owner truth for every publishable landing result; the workspace can project into one target `Page` at publish time. | New truth stores, freeform HTML/JSX, hidden publish semantics, route-family expansion, generic website generator behavior. |

## Relationship to current truth

`LandingDraft` is the workspace-facing contract view of a landing composition draft.

It is not a second source of truth.

The draft is composed from existing structured entities and assets, then verified, previewed, and only later handed into the canonical publish workflow.

There is no separate landing-owned published truth in v1. Every publishable landing draft must resolve to exactly one `Page` owner before publish, even if that target `Page` is newly created during the workflow.

## Contract shape

### Spec metadata

| Field | Status | Notes |
|---|---|---|
| `specVersion` | Required | Factory contract version. |
| `candidateId` | Required | Stable identifier for the generated landing candidate. |
| `landingDraftId` | Required | Stable identifier for the workspace draft artifact. |
| `pageId` | Required | Canonical `Page` truth owner that the draft will publish into. |
| `basePageId` | Allowed | Existing `Page` truth the draft is derived from, when applicable. |
| `compositionFamily` | Required | Fixed to `landing`. |
| `variantKey` | Optional | Human-readable variant marker for comparison. |
| `sourceContextSummary` | Required | Short trace of the brief and proof basis used to create the draft. |

### Mirrored composition fields

| Field | Status | Notes |
|---|---|---|
| `slug` | Allowed | Used when the landing publishes to a route-owning page shell. |
| `title` | Required | Landing title or workspace-facing label. |
| `hero` | Required | Top composition block. |
| `serviceCardIds` | Allowed | References to existing `Service` entities. |
| `caseCardIds` | Allowed | References to existing `Case` entities. |
| `mediaAssetIds` | Allowed | References to existing `MediaAsset` entities. |
| `headerRef` | Allowed | Global header information or a published header shell reference. |
| `footerRef` | Allowed | Global footer information or a published footer shell reference. |
| `ctaVariant` | Required | CTA label or variant used by the composition. |
| `seo` | Allowed | Publish-ready landing SEO data when needed. |

## Allowed references

Only references that can be resolved against current runtime truth are allowed in the first landing-first rollout:

- `serviceCardIds` -> `Service`
- `caseCardIds` -> `Case`
- `mediaAssetIds` -> `MediaAsset`
- `headerRef` / `footerRef` -> published global shell information for fixed shell regions
- `basePageId` -> existing `Page` truth, when the draft is derived from an existing standalone page

Use `basePageId` to describe provenance. Use `pageId` to describe the eventual publish owner.

## Source context expectations

The draft must state, in compact form, what it was generated from:

- owner brief or task
- existing page or landing draft snapshot, if any
- selected service, case, and media proof material
- composition intent or target audience
- variant intent, if any

If the source context cannot be stated clearly, the draft is not ready for verification.

## Explicit exclusions

- freeform HTML or JSX
- generic page-builder drift
- route-family expansion by default
- raw chat history as an artifact
- service-route-only assumptions
- any claim that the draft is itself published truth

## Contract rule

Any field not listed above is out of contract for v1 unless it already exists in the current composition truth and is explicitly required by the verification contract.
