# Content Operations / Admin Console MVP Spec v0.1

Проект: «Экостройконтинент»  
Статус: execution spec for phase-1 content operations  
Основание: [PRD v0.3.1](./PRD_Экостройконтинент_v0.3.1.md), [Content Contract v0.2](./Content_Contract_Экостройконтинент_v0.2.md), [Launch SEO Core Spec v0.1](./Launch_SEO_Core_Экостройконтинент_v0.1.md), [Content Inventory & Evidence Register v0.1](./Content_Inventory_and_Evidence_Register_Экостройконтинент_v0.1.md)

## 1. Purpose and Scope

Эта админка нужна как минимальная контентная операционная система для phase 1.

Её задача:

- заводить контентные сущности через понятные карточки и формы;
- собирать и нормализовать доказательную базу;
- связывать сущности, блоки и медиа;
- готовить контент к human-mediated publish.

Phase-1 priority: content operations, not page-builder complexity.

Админка не должна "рисовать сайт" как no-code builder. Она должна помогать малой команде вручную вести content entities, case packs, media assets, relations и publish readiness.

## 2. Operating Principles

- Content entities are structured, not freeform chaos.
- Media is a first-class content asset, not an afterthought.
- Relations matter: page, service, case, FAQ, review and media must be linkable through stable references.
- `locale` stays in the content model, but first-slice admin behavior is `RU-only`.
- SQL is the source of truth for entities, metadata, relations, statuses and publish state.
- S3 stores binaries.
- CDN serves public media.
- One asset may be linked to multiple entities without binary duplication.
- Publish happens through editorial flow, not direct uncontrolled editing of live pages.
- Blocks are typed and ordered; they are not a raw HTML dump.
- Admin UX must optimize for fast manual entry, not visual wizardry.

## 3. MVP Admin Surfaces

Минимальный состав surface/modules:

### 3.1 Entity list views

- list by type: `Page`, `Service`, `Case`, `Article`, `FAQ`, `Review`, `MediaAsset`, `Gallery`
- filters by `status`, `locale`, `updated_at`, `owner review needed`
- quick indicators: missing SEO basics, missing media, missing relations, blocked for publish

### 3.2 Entity detail / editor

- one card-based edit screen per entity
- simple forms first
- tabs or sections instead of many separate screens: `Basics`, `Content`, `Relations`, `SEO`, `Media`, `Status`
- first slice defaults entity editing to `ru` without building a full multilingual side-by-side UI

### 3.3 Block editor

- ordered typed blocks inside `Page`
- add / remove / reorder blocks
- edit a block as a simple card, not a visual canvas

### 3.4 Media / gallery console

- upload media
- fill metadata
- group assets into galleries
- reuse assets via picker instead of reupload

### 3.5 Relation / linking layer

- searchable relation picker for linking services, cases, FAQs, reviews and media
- relation roles such as `primary`, `gallery`, `inline`, `cover`

### 3.6 Global settings editor

- company and launch-region truth
- default SEO
- default CTAs
- local business data

Это достаточно для phase 1. Advanced dashboards, no-code layout systems and DAM-scale media tooling не входят в baseline.

## 4. Entity Cards / Forms

Ниже описан минимальный набор сущностей, которые должны редактироваться в MVP.

### 4.1 Page

- Purpose: публичная страница сайта, собранная из typed blocks и relations
- Core fields: `slug`, `locale`, `status`, `page_type`, `title`, `h1`, `intro`, `blocks[]`, `primary_image`, `seo_title`, `seo_description`, `canonical_url`, `noindex`, `schema_type`
- Required fields: `slug`, `locale`, `status`, `page_type`, `title`, `h1`
- Optional fields: `intro`, `primary_image`, `canonical_url`, `schema_type`, `noindex`
- Relation points: block refs, service refs, case refs, FAQ refs, review refs, media refs
- Must be editable via simple form/card:
  - basics
  - SEO
  - ordered blocks
  - primary image
  - publish status

`locale` remains part of the entity model, but phase-1 admin may default it to `ru` and avoid a full multi-locale editing UI in the first implementation slice.

### 4.2 Service

- Purpose: canonical service entity for money pages and reuse in blocks/articles/FAQs
- Core fields: `slug`, `title`, `summary`, `problems_solved`, `service_steps[]`, `materials_or_methods[]`, `faq_refs[]`, `case_refs[]`, `service_area_refs[]`, `cta_variant`, `seo_*`
- Required fields: `slug`, `title`, `summary`, `cta_variant`
- Optional fields: `problems_solved`, `service_steps[]`, `materials_or_methods[]`, `faq_refs[]`, `case_refs[]`, `service_area_refs[]`, `seo_*`
- Relation points: FAQ items, case pages, service areas, media usage via blocks or galleries
- Must be editable via simple form/card:
  - summary and scope
  - steps / methods
  - linked cases and FAQs
  - CTA variant
  - SEO basics

### 4.3 Case

- Purpose: canonical project/case entity for proof-led launch content
- Core fields: `slug`, `title`, `location`, `project_type`, `task`, `work_scope`, `result`, `gallery_refs[]`, `service_refs[]`, `testimonial_ref`, `seo_*`
- Required fields: `slug`, `title`, `location`, `task`, `work_scope`, `result`
- Optional fields: `project_type`, `gallery_refs[]`, `service_refs[]`, `testimonial_ref`, `seo_*`
- Relation points: services, galleries, testimonial, media assets through gallery
- Must be editable via simple form/card:
  - case facts
  - related services
  - gallery links
  - testimonial link
  - publish status

### 4.4 Article

- Purpose: minimal supporting content and knowledge layer already included in launch-core
- Core fields: `slug`, `title`, `excerpt`, `body`, `topic`, `service_refs[]`, `faq_refs[]`, `author`, `publish_date`, `seo_*`
- Required fields: `slug`, `title`, `excerpt`, `body`, `topic`
- Optional fields: `service_refs[]`, `faq_refs[]`, `author`, `publish_date`, `seo_*`
- Relation points: services, FAQs, media assets
- Must be editable via simple form/card:
  - body
  - related services
  - related FAQs
  - SEO basics

### 4.5 FAQ Item

- Purpose: reusable FAQ entity for services and supporting pages
- Core fields: `question`, `answer`, `service_refs[]`, `topic_refs[]`
- Required fields: `question`, `answer`
- Optional fields: `service_refs[]`, `topic_refs[]`
- Relation points: services, articles, pages through blocks
- Must be editable via simple form/card:
  - question
  - answer
  - related services/topics

### 4.6 Review / Testimonial

- Purpose: reusable testimonial/trust unit
- Core fields: `author_name`, `author_role`, `quote`, `source_type`, `is_public`, `related_service_refs[]`, `related_case_refs[]`
- Required fields: `quote`, `source_type`, `is_public`
- Optional fields: `author_name`, `author_role`, `related_service_refs[]`, `related_case_refs[]`
- Relation points: service pages, case pages, pages through blocks
- Must be editable via simple form/card:
  - quote text
  - public/non-public flag
  - related services/cases
  - source note

### 4.7 Global Settings

- Purpose: launch-wide business truth and reusable defaults
- Core fields: `company_name`, `phone`, `messengers`, `address_or_service_area`, `default_seo`, `default_ctas`, `organization_or_local_business_data`
- Required fields: `company_name`, `address_or_service_area`
- Optional fields: `phone`, `messengers`, `default_seo`, `default_ctas`, `organization_or_local_business_data`
- Relation points: feeds all pages and local SEO truth
- Must be editable via simple form/card:
  - company identity
  - primary service area / launch region
  - contacts and messengers
  - default SEO and CTAs

### 4.8 MediaAsset

- Purpose: canonical metadata record for a binary in S3/CDN
- Core fields:
  - `asset_id`
  - `asset_type` (`image`, `video`, `document`)
  - `storage_key`
  - `mime_type`
  - `original_filename`
  - `locale`
  - `status`
  - `alt`
  - `caption`
  - `ownership_note`
  - `source_note`
- Required fields: `asset_type`, `storage_key`, `mime_type`, `original_filename`, `status`
- Optional fields: `locale`, `alt`, `caption`, `ownership_note`, `source_note`
- Relation points: page primary image, gallery membership, block usage, entity-media links
- Must be editable via simple form/card:
  - metadata
  - asset preview
  - usage links
  - publishability status

### 4.9 Gallery

- Purpose: lightweight grouping concept behind existing `gallery_refs[]`
- Core fields: `title`, `locale`, `status`, `asset_refs[]`, `primary_asset_ref`, `caption`
- Required fields: `title`, `asset_refs[]`
- Optional fields: `locale`, `status`, `primary_asset_ref`, `caption`
- Relation points: cases, pages, gallery blocks
- Must be editable via simple form/card:
  - ordered asset list
  - primary asset
  - caption / label

Gallery in MVP is not a full DAM album system. It is only an ordered reusable grouping for cases and page blocks.
It should stay lightweight in the first implementation slice and must not expand into a semi-DAM subsystem by default.

## 5. Typed Block Model

`blocks[]` must not be a black box, because:

- launch pages need structured content and reusable proof units;
- relations to services, cases, FAQs and media must stay visible;
- publish validation becomes impossible if blocks are arbitrary blobs.

### 5.1 Phase-1 block types

- `hero`
- `rich_text`
- `service_list`
- `case_list`
- `faq_list`
- `gallery`
- `cta`
- `contact`

Short proof bullets or trust facts can live inside `rich_text` in MVP. A dedicated trust-facts block is not required for launch.

### 5.2 Block card concept

Each block card should have:

- `type`
- internal `label`
- `order`
- optional `heading`
- visibility toggle
- block-specific fields
- linked entity refs and/or media refs where applicable

### 5.3 Minimum block fields by type

- `hero`: heading, subheading, primary CTA, optional media ref
- `rich_text`: heading, body
- `service_list`: heading, selected service refs
- `case_list`: heading, selected case refs
- `faq_list`: heading, selected FAQ refs
- `gallery`: heading, gallery ref or media refs
- `cta`: text, CTA variant, destination/contact method
- `contact`: heading, phone/messenger/form settings sourced from global truth

### 5.4 Editing model

- add block from a type picker
- edit in place as a simple card
- reorder by move up/down or numeric order
- no drag-and-drop page canvas required for MVP

Block lifecycle rides on the parent page revision. Blocks do not need an independent publish workflow.

## 6. Media / Gallery Operations

Media normalization is one of the main reasons this admin exists.

### 6.1 Upload flow

1. User uploads image or video in admin.
2. Binary goes to S3 under generated storage key.
3. System creates `MediaAsset` row in SQL.
4. Technical metadata is extracted when possible: mime type, size, dimensions, duration for video.
5. Editor fills missing human metadata.
6. Asset is linked to entities or placed in gallery through picker.

### 6.2 Required media metadata

- asset type
- original filename
- storage key
- locale if relevant
- status
- alt text for images used publicly
- caption when the asset needs public context
- source/ownership note

### 6.3 Relation and reuse model

- one asset may be reused by many pages, services, cases and blocks
- reuse happens via relation rows / usage links, not by duplicating file records
- usage role is relation-level:
  - `primary`
  - `cover`
  - `gallery`
  - `inline`
  - `hero`

`Primary flag` should live in asset usage context, not as a global truth for every use of the same file.

### 6.4 Gallery operations

- create a gallery from selected media assets
- define order
- set primary asset
- link gallery to `Case` or `Page` block

### 6.5 Anti-chaos rules

- no anonymous media dump
- uploaded assets without metadata stay easy to find through list filters
- assets should be linked to an entity or gallery whenever they are intended for public use
- asset duplicates by reupload should be discouraged when a reusable existing asset can be linked

Admin must help normalize media, not just store files.

## 7. Storage and Delivery Boundaries

### 7.1 What lives in SQL

- entity records
- localized text fields
- status and publish state
- SEO fields
- typed blocks and their order
- gallery records
- media metadata
- entity/media/gallery relations
- publish timestamps and active published revision references

### 7.2 What lives in S3

- original image/video/document binaries
- optional simple generated variants if implementation adds them later

### 7.3 What CDN serves

- public media URLs derived from asset records and storage keys
- stable delivery layer for published media

### 7.4 Canonical references

- content entities should reference media by `MediaAsset` ID or `Gallery` ID, not by raw CDN URL
- raw public URL is a delivery output, not the source-of-truth identifier
- `storage_key` in SQL is the canonical link between entity metadata and the S3 object

## 8. Editorial Lifecycle

The lifecycle inside admin remains:

- `Draft`
- `Review`
- `Published`

### 8.1 Draft

- create and edit entity
- upload and link media
- edit blocks and relations
- incomplete content allowed

### 8.2 Review

- entity is considered structurally complete enough for human review
- editor checks factual completeness, proof assets, SEO basics and claim safety
- `Business Owner` joins where required by canon

### 8.3 Published

- entity revision becomes the active published revision
- published page content can be rendered publicly
- future edits should create the next working revision instead of silently mutating live content

### 8.4 Allowed actions by stage

- `Draft`: full edit, upload, link, reorder
- `Review`: edit still allowed, but missing-field and proof warnings should be visible
- `Published`: publish, rollback, clone to new draft revision

No complex approval engine is required.

### 8.5 Slug change side effects

If a published entity changes its `slug`, admin must not treat it as a silent text edit.

Minimum expected side effects:

- show an explicit warning before save/publish
- mark redirect creation as required
- mark public page revalidation as required
- mark sitemap update as required

Phase 1 does not need a complex redirect manager, but it does need a visible operational signal that changing a published slug affects stable public URLs.

## 9. Publish Validations and Minimum Gates

Publish-time validation should be launch-safe, not overengineered.

### 9.1 Generic minimum gates

- required fields present
- unique slug in entity type + locale where applicable
- title / H1 / SEO basics present where applicable
- relations resolve to valid entities
- no broken gallery/media refs
- entity has minimum factual completeness for its type

### 9.2 Page-specific gates

- page type defined
- at least one visible content block
- required blocks filled enough to render safely
- money pages have visible CTA

### 9.3 Service-specific gates

- summary present
- service scope not empty
- CTA variant selected
- at least one proof path available for launch:
  - linked case
  - linked gallery/media
  - linked FAQ

### 9.4 Case-specific gates

- `task`, `work_scope`, `result` present
- location context present
- at least one gallery or minimum visual set linked
- case does not go live as a thin stub without proof

### 9.5 Media-specific gates

- public-facing images have alt text
- status allows public use
- ownership/source note is filled where needed

### 9.6 Review-specific gate

- `is_public=true` only when quote is approved for publication

### 9.7 Published slug-change gate

- changing `slug` on a published entity should require an explicit confirm step
- publish UI should show pending redirect / revalidation / sitemap side effects
- system should not allow "invisible" slug mutation of a live indexed page

This does not require 200 rules. It requires enough rules to stop empty or misleading pages from going live.

## 10. Admin UX for a Small Team

The admin is for a small manual team, not for a content factory.

### 10.1 UX priorities

- form and card > visual magic
- quick manual input is normal
- list/edit/link/upload flows should be short
- common tasks should take a few clicks:
  - create entity
  - upload media
  - link proof asset
  - move entity to review
  - publish

### 10.2 Minimum screen structure

- `List`
- `Detail/Edit`
- `Media picker`
- `Relation picker`
- `Global settings`

### 10.3 Practical usability requirements

- searchable relation pickers
- obvious missing-field warnings
- obvious status chips
- keyboard-friendly forms where possible
- no need for user to know storage internals
- owner-level user should be able to review/edit key facts without technical pain
- no full bilingual editing shell in phase 1; `ru` should feel like the default working locale

## 11. Non-Goals

- enterprise DAM
- complex workflow engine
- full no-code page builder
- advanced permissions matrix
- autonomous AI publishing
- heavy analytics cockpit
- overengineered version-control platform
- large multi-tenant architecture
- deep asset transformation pipeline unless truly needed later
- pixel-perfect visual page composer

## 12. Recommended Implementation Sequence

### 12.1 First implementation slice

Build the narrowest useful slice first:

1. `Global Settings`
2. `MediaAsset`
3. `Gallery`
4. `Service`
5. `Case`
6. `Page`

This slice already unlocks the main phase-1 bottleneck: collect business truth, upload/normalize media, assemble proof-led service/case content, and prepare launch pages.

### 12.2 Early-next slice

- `FAQ Item`
- `Review / Testimonial`
- `Article`

`Article` is optional early-next rather than mandatory first-slice scope.

### 12.3 Full MVP sequence

1. SQL baseline for entities, statuses, localized fields, relations and media metadata.
2. S3 upload flow + `MediaAsset` records + CDN URL derivation.
3. First implementation slice forms: `Global Settings`, `MediaAsset`, `Gallery`, `Service`, `Case`, `Page`.
4. Relation picker + gallery grouping + entity/media linking.
5. Typed block editor inside `Page`.
6. Draft / Review / Published flow with minimum validation gates, rollback semantics and slug-change warnings.
7. Early-next slice forms: `FAQ`, `Review`, `Article`.
8. Lightweight quality filters in list views: missing media, missing SEO basics, missing proof links.

Optional after MVP baseline:

- internal AI assist inside forms
- richer media search
- richer review queue filters

The correct MVP end state is simple: the team can create, link, normalize and safely publish launch-core content without losing control of facts or media.
