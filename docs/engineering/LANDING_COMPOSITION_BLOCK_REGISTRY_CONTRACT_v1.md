# LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1

## Purpose

This contract defines the closed block registry for the landing-first composition workspace.

It keeps composition structured and reviewable without turning the project into a generic page builder.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Allowed landing composition blocks, block order, required and optional inputs, and explicit exclusions. | Generic page blocks, page-builder freedom, freeform HTML, route ownership truth. | Existing structured entities and assets can be referenced as composition inputs. | A universal block platform, route-family expansion by default, service-page-only assumptions, uncontrolled layout freedom. |

## Registry rule

The registry is closed.

Only the blocks listed below are allowed in v1.

## Allowed blocks

| Block id | Purpose | Required inputs | Optional inputs | Order | Notes |
|---|---|---|---|---|---|
| `landing_hero` | Top composition introduction. | `title`, `hero` | `ctaVariant` | 1 | The top block may incorporate global shell information. |
| `media_strip` | Visual support and proof media. | `mediaAssetIds` | Media metadata from referenced assets | 2 | References must resolve to published media assets when publish-ready. |
| `service_cards` | Reused service proof or offering cards. | `serviceCardIds` | Card metadata from the referenced services | 3 | This is entity-backed composition, not a service-route renderer. |
| `case_cards` | Proof through related cases. | `caseCardIds` | Card metadata from the referenced cases | 4 | Only published cases may be referenced at publish time. |
| `content_band` | Supporting copy or thematic explanation. | `body` | `subtitle` | 5 | Must stay structured and bounded. |
| `cta_band` | Final action and conversion prompt. | `ctaVariant` | `ctaNote` | 6 | Can reference the workspace goal but not invent claims. |

## Shell regions

The following are fixed shell regions, not composition blocks and not part of block ordering:

- `landing_header`
- `landing_footer`

They are populated from published global shell data or shell references and must not be treated as reorderable block ids.

## Ordering and usage constraints

- `landing_hero` must be first.
- `media_strip` and `service_cards` may appear before or after one another if the registry order is preserved.
- `content_band` and `cta_band` must come after the proof-oriented blocks.
- Header and footer are fixed shell regions, not open-ended layout slots and not composition blocks.
- No block may appear more than once.

## Variant rule

No independent block variants are introduced in v1.

If a layout change cannot be expressed with the blocks above and their allowed inputs, it is out of scope for this rollout.

## Explicitly excluded sections

- `faq_list`
- `article_list`
- `review_list`
- arbitrary `page.hero` or `page.blocks[]` drift
- custom HTML
- JSX
- any non-compositional route-owning block family

## Runtime honesty note

The registry is designed to match the landing composition workspace and the current deterministic renderer, not to force the page model into shape.

If a section would require a new route family, a new page-builder system, or renderer behavior that does not already exist, it is not part of this registry.
