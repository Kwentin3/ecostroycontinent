# LANDING_COMPOSITION_BLOCK_REGISTRY_CONTRACT_v1

## Purpose

This contract defines the closed block registry for the landing-first composition workspace.

It keeps composition structured and reviewable without turning the project into a generic page builder.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| Allowed landing composition blocks, block order, ordered proof inputs, Stage A visual-semantic scope, and explicit exclusions. | Generic page blocks, page-builder freedom, freeform HTML, route ownership truth. | Existing structured entities and assets can be referenced as composition inputs. | A universal block platform, route-family expansion by default, service-page-only assumptions, uncontrolled layout freedom. |

## Registry rule

The registry is closed.

Only the blocks listed below are allowed in v1.

## Allowed blocks

| Block id | Purpose | Required inputs | Optional inputs | Order | Stage A visual-semantic scope | Notes |
|---|---|---|---|---|---|---|
| `landing_hero` | Top composition introduction. | `title`, `hero` | `ctaVariant`, `textEmphasisPreset`, `surfaceTone` | 1 | Yes | The top block may incorporate global shell information. |
| `media_strip` | Visual support and proof media. | `mediaAssetIds` | Media metadata from referenced assets | 2 | No in Stage A | References must resolve to published media assets when publish-ready. Input order is preserved. |
| `service_cards` | Reused service proof or offering cards. | `serviceCardIds` | Card metadata from the referenced services | 3 | No in Stage A | This is entity-backed composition, not a service-route renderer. Input order is preserved. |
| `case_cards` | Proof through related cases. | `caseCardIds` | Card metadata from the referenced cases | 4 | No in Stage A | Only published cases may be referenced at publish time. Input order is preserved. |
| `content_band` | Supporting copy or thematic explanation. | `body` | `subtitle`, `textEmphasisPreset`, `surfaceTone` | 5 | Yes | Must stay structured and bounded. |
| `cta_band` | Final action and conversion prompt. | `ctaVariant` | `ctaNote`, `textEmphasisPreset`, `surfaceTone` | 6 | Yes | Can reference the workspace goal but not invent claims. |

## Shell regions

The following are fixed shell regions, not composition blocks and not part of block ordering:

- `landing_header`
- `landing_footer`

They are populated from published global shell data or shell references and must not be treated as reorderable block ids.

## Ordering and usage constraints

- `landing_hero` must be first.
- `media_strip` and `service_cards` may appear before or after one another if the registry order is preserved.
- `content_band` and `cta_band` must come after the proof-oriented blocks.
- `mediaAssetIds`, `serviceCardIds`, and `caseCardIds` preserve declared order inside their respective proof blocks.
- Header and footer are fixed shell regions, not open-ended layout slots and not composition blocks.
- No block may appear more than once.

## Stage A visual-semantic rule

Stage A visual-semantic fields are intentionally narrow.

Allowed now:
- `textEmphasisPreset` on `landing_hero`, `content_band`, `cta_band`
- `surfaceTone` on `landing_hero`, `content_band`, `cta_band`

Not allowed now:
- `surfaceTone` on proof-heavy blocks
- raw typography controls
- raw colors or direct background values

Future Stage B may evaluate bounded `surfaceTone` support for proof-heavy blocks such as `media_strip` or `case_cards`, but that is not part of this registry revision.

## Variant rule

No independent block variants are introduced beyond the bounded Stage A fields above.

If a layout or styling change cannot be expressed with the blocks above, their ordered refs, and the allowed Stage A fields, it is out of scope for this rollout.

## Explicitly excluded sections

- `faq_list`
- `article_list`
- `review_list`
- arbitrary `page.hero` or `page.blocks[]` drift
- custom HTML
- JSX
- any non-compositional route-owning block family
- generic bridge slots between arbitrary blocks
- per-card visual styling controls

## Runtime honesty note

The registry is designed to match the landing composition workspace and the current deterministic renderer, not to force the page model into shape.

If a section would require a new route family, a new page-builder system, or renderer behavior that does not already exist, it is not part of this registry.
