# SERVICE_RENDER_CONTRACT_v1

## Purpose

This contract defines deterministic rendering for approved service landing specs in the first rollout.

It is the render contract for `/services/[slug]` only.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Deterministic preview and public render rules, section-to-render mapping, failure behavior, fallback rules. | Frontend architecture beyond the service route, design system policy, other route families. | The service section registry and service spec contract are already locked. | Silent fallback to unsupported sections, arbitrary markup generation, page-builder semantics. |

## Render principle

The same approved service artifact must render the same service page every time, given the same renderer contract version and published lookup state.

Preview and public render must use the same section order and the same section mappings.

## Render inputs

- Approved service landing spec
- Published service lookup data for related cases, galleries, and media
- Published global settings for fallback presentation text only where the current route already uses it

Preview may inspect the working candidate for review annotations, but preview must not invent a different layout from public render.

## Supported render mapping

| Section id | Render target | Source fields | Render rule |
|---|---|---|---|
| `service_hero` | Top hero band | `h1`, `summary`, `ctaVariant` | Render the commercial intro at the top of the page. The section is service-specific and is not the standalone page `hero` block. |
| `primary_media` | Primary media section | `primaryMediaAssetId` | Resolve the published media asset and render it if present. If the reference does not resolve, verification must block the candidate. |
| `service_scope` | Scope and methods section | `serviceScope`, `problemsSolved`, `methods` | Render the explanatory service section as a single deterministic block. |
| `related_cases` | Related case cards | `relatedCaseIds` | Resolve only published cases and render them in the registry order. |
| `gallery` | Gallery section | `galleryIds` | Resolve only published galleries and render referenced media assets in the registry order. |

## No unsafe fallback rule

- Unknown section ids must not be rendered as a generic fallback.
- Unknown section ids must fail verification before public release.
- Missing required inputs for a declared section must fail verification, not degrade silently.
- Optional sections may be omitted if they are not present in the candidate.

## Preview vs public

| Mode | Allowed inputs | Allowed behavior |
|---|---|---|
| Preview | Working candidate plus published lookup data | May show review annotations and validation notes. |
| Public | Approved published artifact plus published lookup data only | Must show only the published service state. |

Preview and public may share the same render code path, but they must not diverge in section semantics.

## Runtime honesty note

This contract does not rely on the standalone page block model.

It intentionally avoids the known page-model `hero` mismatch and the absent `faq_list` block. Those are outside this rollout.

If a future change needs a new section family, that is a new engineering contract, not a silent extension of this one.

