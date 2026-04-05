# SERVICE_BLOCK_REGISTRY_CONTRACT_v1

## Purpose

This contract defines the exact section registry allowed for the service-first landing factory rollout.

It is not the generic `page` block union. It is a service-only section model tied to the current `/services/[slug]` runtime.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
|---|---|---|---|
| The allowed service section set, section order, required and optional section inputs, and explicit exclusions. | Generic page blocks, FAQ/article/review surfaces, contact pages, homepage behavior. | The service route already exists and remains the only public target for this rollout. | A universal block platform, custom HTML sections, route-family expansion, page-builder drift. |

## Registry rule

The registry is closed.

Only the sections listed below are allowed in v1. No independent variant system is introduced in this rollout.

## Allowed sections

| Section id | Purpose | Required inputs | Optional inputs | Order | Notes |
|---|---|---|---|---|---|
| `service_hero` | Top commercial introduction for the service. | `h1`, `summary`, `ctaVariant` | `title` as internal label only | 1 | This is service-specific and does not reuse the `page.hero` block contract. |
| `primary_media` | Main visual support for the service. | `primaryMediaAssetId` | Media metadata from the referenced asset | 2 | The reference must resolve to a published media asset when publish-ready. |
| `service_scope` | Explains what the service covers and why it matters. | `serviceScope` | `problemsSolved`, `methods` | 3 | This is the core explanatory section. |
| `related_cases` | Shows proof through related published cases. | `relatedCaseIds` | None | 4 | Only published cases may be referenced at publish time. |
| `gallery` | Shows visual proof through published galleries. | `galleryIds` | None | 5 | Only published galleries may be referenced at publish time. |

## Ordering and usage constraints

- `service_hero` must be first if present.
- `primary_media` comes after `service_hero`.
- `service_scope` comes after `primary_media`.
- `related_cases` and `gallery` are optional and must follow the core explanation sections.
- Section order is fixed. Reordering is only allowed inside this registry order.
- No section may appear more than once.

## Variant rule

No independent block variants are introduced in v1.

If a layout change cannot be expressed with the sections above and their optional inputs, it is out of scope for this rollout.

## Explicitly excluded sections

The following are not allowed in this rollout:

- `hero` from the standalone page block model
- `faq_list`
- `article_list`
- `review_list`
- `contact`
- standalone `cta`
- `custom_html`
- `jsx`
- any non-service section family

## Runtime honesty note

The service registry is designed to match the current service route and the current service renderer, not to force the page model into shape.

If a section would require a new route family, a new page-block system, or a renderer behavior that does not already exist for services, it is not part of this registry.

