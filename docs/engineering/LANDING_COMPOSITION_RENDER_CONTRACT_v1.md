# LANDING_COMPOSITION_RENDER_CONTRACT_v1

## Purpose

This contract defines deterministic rendering for approved landing composition drafts in the landing-first workspace.

The same approved composition must render the same result every time, given the same renderer version and published lookup state.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Deterministic preview and public render rules, block-to-render mapping, failure behavior, fallback rules. | Frontend architecture beyond the workspace, design system policy, generic page-builder semantics, route ownership. | The landing composition spec and block registry are already locked. | Silent fallback to unsupported sections, arbitrary markup generation, generic page-builder behavior. |

## Render principle

Preview and public render must use the same block order and the same block mappings.

The published result is always a `Page`-owned published shell or another route-owning page truth carrier, but the render semantics must remain deterministic.

## Render inputs

- Approved landing composition spec
- Published lookups for related services, cases, galleries, and media
- Published global shell data for header/footer presentation

Preview may inspect the working draft for review annotations, but preview must not invent a different layout from public render.

## Supported render mapping

| Block id | Render target | Source fields | Render rule |
|---|---|---|---|
| `landing_hero` | Top hero band | `title`, `hero`, `ctaVariant` | Render the landing introduction at the top of the page. |
| `media_strip` | Visual support strip | `mediaAssetIds` | Resolve only published media assets and render them in registry order. |
| `service_cards` | Service proof cards | `serviceCardIds` | Resolve only published services and render them in registry order. |
| `case_cards` | Case proof cards | `caseCardIds` | Resolve only published cases and render them in registry order. |
| `content_band` | Supporting composition band | `body`, `subtitle` | Render the supporting copy as a single deterministic band. |
| `cta_band` | Final CTA band | `ctaVariant`, `ctaNote` | Render the closing action area without inventing claims. |
## Shell regions

| Region id | Render target | Source fields | Render rule |
|---|---|---|---|
| `landing_header` | Header shell region | `headerRef` | Render published global shell data only. |
| `landing_footer` | Footer shell region | `footerRef` | Render published global shell data only. |

## No unsafe fallback rule

- Unknown block ids must not be rendered as a generic fallback.
- Unknown block ids must fail verification before public release.
- Missing required inputs for a declared block must fail verification, not degrade silently.
- Optional blocks may be omitted if they are not present in the draft.
- Shell regions are not block ids; they are fixed presentation regions and must resolve separately from the block registry.

## Preview vs public

| Mode | Allowed inputs | Allowed behavior |
|---|---|---|
| Preview | Working draft plus published lookup data | May show review annotations and validation notes. |
| Public | Approved published artifact plus published lookup data only | Must show only the published landing truth. |

Preview and public may share the same render code path, but they must not diverge in block semantics.

## Runtime honesty note

This contract does not rely on freeform page-builder behavior.

If a future change needs a new block family, that is a new engineering contract, not a silent extension of this one.
