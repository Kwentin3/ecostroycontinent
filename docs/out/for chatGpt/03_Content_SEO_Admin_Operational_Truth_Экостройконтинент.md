# Content, SEO, and Admin Operational Truth

## Purpose

Этот файл объясняет, как проект practically живёт на уровне content, SEO, admin, media и publish без проваливания в low-level implementation.

## Canonical truths

- Core content entities:
  - `Page`
  - `Service`
  - `Case / Project`
  - `Article`
  - `FAQ Item`
  - `Review / Testimonial`
  - `Global Settings`
  - supporting entities: `MediaAsset`, `Gallery`
- Страница не мешок текста: public pages собираются из структурированных сущностей и typed blocks.
- `blocks[]` are typed and ordered; phase-1 types are limited and intentional.
- `Gallery` stays lightweight; it is not a semi-DAM album subsystem.
- `locale` stays in the model, but first-slice admin behavior is operationally `RU-only`.

## Content and media relation posture

- Relations are first-class and should use stable refs.
- `Service`, `Case` and `Article` stay reusable route-owning entities.
- `Page` composes and renders; it should not duplicate route truth.
- Media should be reusable across entities without binary duplication.
- Public-facing media should carry basic metadata such as `alt`, caption when needed, and ownership/source note.

## Launch-core operational posture

- Launch-core is intentionally small and proof-led.
- Better `5` strong service pages than `6-7` weak ones.
- Better `2-3` real cases than a larger fake/empty case layer.
- Supporting content should stay narrow: a few FAQs, a few trust pages, a few supporting topics.
- `Contacts` is not honest to publish as a conversion page until public contact truth is confirmed.

## Evidence minimum logic

- Service page should not go live as a thin promise page; it needs at least:
  - real service scope
  - CTA truth
  - one proof path such as case, gallery/media, or FAQ-backed factual support
- Case page should not go live without:
  - `task`
  - `work_scope`
  - `result`
  - location context
  - minimum visual proof
- Claims-heavy wording requires owner review.

## Public SEO and read-side truths

- One service page = one main intent.
- Money pages need unique `slug`, `H1` and SEO intent.
- Filters are not indexable pages by default.
- Local business signals must stay consistent across page copy, contacts, schema and global settings.
- `sitemap.xml`, Search Console and basic conversion tracking are mandatory from launch.

## Admin MVP shape

- Admin exists to create, edit, normalize, link and publish structured content.
- First implementation slice is narrow:
  - `Global Settings`
  - `MediaAsset`
  - `Gallery`
  - `Service`
  - `Case`
  - `Page`
- Early-next slice: `FAQ`, `Review`, `Article`.
- This is a content operations console, not a page-builder-first product.

## Publish gates and side effects

- Minimum publish gate checks required fields, valid refs, SEO basics, visible CTA where needed and minimum factual completeness.
- Published read-side must consume validated published revisions only.
- Slug change on a published entity is not a silent edit; it creates redirect / revalidation / sitemap obligations.

## Small-team operating logic

- Fast manual forms beat visual magic.
- Human review remains central.
- AI may help drafting, but public truth still depends on humans, evidence and explicit publish action.

## Do not reopen by default

- `Structured entities over freeform rich-text chaos`
- `Typed blocks, not arbitrary custom blobs`
- `Gallery is lightweight`
- `RU-only admin behavior for first slice`
- `Proof-led launch core`
- `Publish gates stay real`

## What this file owns

- Practical content/SEO/admin truth.
- Evidence minimum logic.
- Launch-safe operational constraints for a small team.

## What this file does not own

- Full CMS blueprint.
- Detailed keyword research.
- Full DAM policy.
- CRM / analytics / future AI surfaces.

## Source docs used

- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Launch_SEO_Core_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md`
- `docs/product-ux/Content_Operations_Admin_Console_MVP_Spec_Экостройконтинент_v0.1.md`
