# LANDING_COMPOSITION_SPEC_CONTRACT_v1

## Purpose

This contract defines the engineering shape of the landing-first composition draft used by the AI-assisted workspace.

It is the primary contract for one-page composition work built from existing structured entities and assets. It is not a generic page builder, not autonomous publish, and not a raw styling surface.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Landing draft shape, allowed references, ordered proof inputs, page-scoped visual-semantic intent, workspace-facing spec metadata, and the target `Page` owner for publish. | Render implementation details, raw visual values, typography micromanagement, generic page-builder semantics, route ownership truth. | Canonical content stays in Content Core; `Page` is the durable owner truth for every publishable landing result; the workspace can project into one target `Page` at publish time. | New truth stores, freeform HTML/JSX, hidden publish semantics, route-family expansion, raw color payloads, arbitrary typography controls. |

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

### Page-level composition fields

| Field | Status | Notes |
|---|---|---|
| `slug` | Allowed | Used when the landing publishes to a route-owning page shell. |
| `title` | Required | Landing title or workspace-facing label. |
| `pageThemeKey` | Required for Stage A landing drafts | Points to an approved landing theme in the theme/token registry. This is page-level atmosphere intent, not a raw palette payload. |
| `hero` | Required | Top composition block. |
| `serviceCardIds` | Allowed | References to existing `Service` entities, preserved in declared order. |
| `caseCardIds` | Allowed | References to existing `Case` entities, preserved in declared order. |
| `mediaAssetIds` | Allowed | References to existing `MediaAsset` entities, preserved in declared order. |
| `headerRef` | Allowed | Global header information or a published header shell reference. |
| `footerRef` | Allowed | Global footer information or a published footer shell reference. |
| `ctaVariant` | Required | CTA label or variant used by the composition. |
| `seo` | Allowed | Publish-ready landing SEO data when needed. |

### Stage A visual-semantic block fields

These fields exist only on page-scoped, text-bearing landing blocks:
- `landing_hero`
- `content_band`
- `cta_band`

| Field | Status | Notes |
|---|---|---|
| `textEmphasisPreset` | Allowed on Stage A text-bearing blocks | Semantic loudness preset. It chooses how loudly the block speaks, not raw typography values. |
| `surfaceTone` | Allowed on Stage A text-bearing blocks | Bounded section treatment resolved through the page theme/token registry. |

### Stage A discipline rules

- `textEmphasisPreset` is semantic loudness only.
- It must not be interpreted as raw `fontSize`, `fontWeight`, font-family, line-height, or arbitrary typography freedom.
- `surfaceTone` is a bounded reference into approved theme semantics, not a raw color/background payload.
- `pageThemeKey` is the current Stage A page-level path and must stay token-backed.

## Allowed references

Only references that can be resolved against current runtime truth are allowed in the first landing-first rollout:

- `serviceCardIds` -> `Service`
- `caseCardIds` -> `Case`
- `mediaAssetIds` -> `MediaAsset`
- `headerRef` / `footerRef` -> published global shell information for fixed shell regions
- `basePageId` -> existing `Page` truth, when the draft is derived from an existing standalone page
- `pageThemeKey` -> approved landing theme entry in the landing theme/token registry

Use `basePageId` to describe provenance. Use `pageId` to describe the eventual publish owner.

## Ordered proof-input semantics

`mediaAssetIds`, `serviceCardIds`, and `caseCardIds` are ordered composition inputs.

Rules:
- input order is part of composition truth;
- preview and public render must preserve this order;
- verification may reject duplicate ids or unresolved ids;
- UI convenience features may help reorder refs, but they must not invent extra ordering layers outside the draft.

## Source context expectations

The draft must state, in compact form, what it was generated from:

- owner brief or task
- existing page or landing draft snapshot, if any
- selected service, case, and media proof material
- composition intent or target audience
- variant intent, if any

If the source context cannot be stated clearly, the draft is not ready for verification.

## Contract field vs token registry vs UI helper

This distinction is mandatory:

- Contract fields own compositional intent such as `pageThemeKey`, `textEmphasisPreset`, and `surfaceTone`.
- The landing theme/token registry owns actual color families, approved pairings, and resolved foreground/background semantics.
- UI helpers may offer conveniences such as copy/apply treatment, recent colors, reuse-this-page-accent hints, or consistency nudges, but those helpers are not composition truth.

## Future extension seam

Stage A does not introduce raw page-level color values.

But `pageThemeKey` must not become a dead-end.

The contract intentionally leaves room for a later bounded page-palette path if all of the following remain true:
- token-backed resolution;
- verification-owned readability and contrast checks;
- consistency-aware behavior;
- no raw freeform styling payloads in the landing draft.

That future seam is not implemented in Stage A and must not be assumed by current UI.

## Explicit exclusions

- raw hex/RGB colors in the landing draft
- arbitrary gradients or background imagery
- arbitrary typography controls
- generic page-builder drift
- route-family expansion by default
- raw chat history as an artifact
- service-route-only assumptions
- any claim that the draft is itself published truth

## Contract rule

Any field not listed above is out of contract for v1 unless it already exists in the current composition truth and is explicitly required by the verification contract.
