# Admin Content Contract First Slice

Проект: «Экостройконтинент»  
Версия: v0.2  
Статус: implementation-facing content contract for admin first slice  
Основание: `PRD_Admin_Console_First_Slice_Экостройконтинент_v0.2.md`, `PRD_Экостройконтинент_v0.3.1.md`, `03_Content_SEO_Admin_Operational_Truth_Экостройконтинент.md`, `02_Domain_and_Architecture_Boundaries_Экостройконтинент.md`, `01_Project_Truth_and_Current_Phase_Экостройконтинент.md`

## 1. Purpose

Этот документ фиксирует implementation-facing content contract для admin console first slice. Его задача не в том, чтобы переписать PRD, а в том, чтобы убрать двусмысленность между admin UI, content core, preview и public read-side в том, как именно понимаются first-slice entities, typed blocks, relations и structural validation.

## 2. Scope

В scope документа входят только:

- `Global Settings`
- `MediaAsset`
- `Gallery`
- `Service`
- `Case`
- `Page`
- typed blocks phase 1
- relations and stable refs
- route ownership and structural validation invariants

Вне scope:

- DB schema
- ORM and table design
- API transport shape
- screen-by-screen GUI behavior
- later-slice entities: `FAQ`, `Review`, `Article`

## 3. Canon assumptions inherited from PRD

- `Content Core` in SQL is the source of truth for entities, relations, statuses and published revisions.
- `Admin Console` is the write-side tool.
- `Public Web` is published read-side only.
- `Service` owns `/services/[slug]`.
- `Case` owns `/cases/[slug]`.
- `Page` owns only standalone pages and page-level composition.
- `MediaAsset` is first-class; `Gallery` remains lightweight.
- Structured entities and typed blocks are mandatory; arbitrary content blobs are not canonical.
- Media truth uses IDs / refs, not raw public URLs.
- RU-only operational behavior is acceptable for first slice.

## 4. First-slice entities and ownership

| Entity | Role in admin domain | Owns route truth? | Notes |
| --- | --- | --- | --- |
| `Global Settings` | Launch-wide business truth and reusable defaults | No | Feeds contacts, local business truth, CTA defaults, SEO defaults |
| `MediaAsset` | Canonical metadata record for binary asset | No | Binary lives outside SQL; metadata truth lives in content core |
| `Gallery` | Lightweight ordered grouping of assets | No | Not a DAM album subsystem |
| `Service` | Route-owning commercial entity | Yes | Canonical owner of `/services/[slug]` |
| `Case` | Route-owning proof entity | Yes | Canonical owner of `/cases/[slug]` |
| `Page` | Standalone page entity and page-level composition shell | Only for standalone pages | Must not duplicate `Service` or `Case` route truth |

## 5. Entity contract

### 5.1 Global Settings

#### Purpose

Stores launch-wide public business truth and reusable defaults used by read-side projections and admin workflows.

#### Contract fields

- public brand name
- legal name
- primary phone
- active messengers
- optional public email
- address or service area wording
- primary launch region
- default CTA variants
- default SEO defaults
- organization / local business data

#### Invariants

- One active `Global Settings` record per operational scope.
- Contact truth used in `Page(type=contacts)` must come from or be consistent with `Global Settings`.
- Inconsistent service area and contact wording is not publishable.

### 5.2 MediaAsset

#### Purpose

Stores canonical metadata for a binary asset used by entities and galleries.

#### Contract fields

- internal asset ID
- asset type
- storage key
- mime type
- original filename
- alt
- caption
- ownership note
- source note
- uploaded by
- uploaded at
- operational status

#### Invariants

- Binary delivery URL is a delivery output, not canonical truth.
- Asset may be reused across multiple entities and galleries.
- Missing required asset binding blocks public-facing usage where the asset is required.

### 5.3 Gallery

#### Purpose

Provides lightweight ordered grouping of assets for cases and page blocks.

#### Contract fields

- title
- ordered asset refs
- primary asset ref
- optional caption
- related entity refs

#### Invariants

- `Gallery` does not own media metadata.
- Asset order is meaningful and preserved.
- Empty gallery is not publishable where gallery content is required.

### 5.4 Service

#### Purpose

Stores canonical commercial truth for a service page in launch-core.

#### Contract fields

- slug
- title
- H1
- summary
- service scope
- problems solved
- steps or methods
- CTA variant
- SEO basics
- related case refs
- related proof refs
- related media or galleries where applicable

#### Invariants

- One service page equals one primary intent.
- `Service` owns canonical route truth for `/services/[slug]`.
- Service cannot be published as a thin promise page without proof path.

### 5.5 Case

#### Purpose

Stores canonical proof truth for a case page in launch-core.

#### Contract fields

- slug
- title
- location
- project type
- task
- work scope
- result
- service refs
- gallery refs
- optional testimonial-style proof ref later, if introduced
- SEO basics

#### Invariants

- `Case` owns canonical route truth for `/cases/[slug]`.
- Case cannot be published without factual minimum and minimum visual proof.

### 5.6 Page

#### Purpose

Stores standalone pages and composition shells for non-route-owning content assembly.

#### Contract fields

- slug
- page type
- title
- H1
- intro
- typed blocks
- primary image when needed
- SEO basics
- refs to related entities or global truth

#### Invariants

- `Page` must not become second route owner for `Service` or `Case`.
- `Page(type=contacts)` depends on confirmed public contact truth.
- `Page(type=about)` is standalone and owner-review-sensitive.

## 6. Typed blocks contract

### Phase-1 block set

- `hero`
- `rich_text`
- `service_list`
- `case_list`
- `gallery`
- `cta`
- `contact`

`faq_list` is deferred with later-slice FAQ introduction.

### Block contract rules

- Every block has `type` and `order`.
- Blocks are ordered and renderable without ad hoc template logic.
- Blocks may contain:
  - simple presentational fields
  - refs to entities
  - refs to media or galleries
- Blocks must not contain arbitrary HTML blobs as canonical truth.
- Block schema is finite and known by code.
- `gallery` block accepts `Gallery` refs only.
- Ordered `MediaAsset` refs fallback inside `gallery` block is not part of first slice.

### Block-specific intent

| Block | Purpose | Typical refs |
| --- | --- | --- |
| `hero` | Top-of-page positioning and primary CTA | optional media ref |
| `rich_text` | Controlled narrative body | no canonical route ownership |
| `service_list` | Selected linked services | `Service` refs |
| `case_list` | Selected linked cases | `Case` refs |
| `gallery` | Ordered visual proof module | `Gallery` refs only |
| `cta` | Explicit conversion prompt | CTA variant and optional contact truth dependency |
| `contact` | Contact presentation block | `Global Settings` dependency |

## 7. Relations and stable refs contract

### Relation rules

- Relations are first-class.
- Relations use stable IDs / refs only.
- Cross-entity references must resolve to existing allowed entity types.
- No relation may rely on freeform pasted slugs, labels or raw URLs as truth.

### Supported relation patterns in first slice

- `Service` -> `Case`
- `Service` -> `Gallery`
- `Case` -> `Service`
- `Case` -> `Gallery`
- `Page` -> `Service`
- `Page` -> `Case`
- `Page` -> `Gallery`
- `Page` -> `Global Settings` dependency through page type or block behavior
- `Gallery` -> `MediaAsset`

### Relation role semantics

Where relation role matters, the implementation may use a narrow role vocabulary:

- `primary`
- `cover`
- `gallery`
- `inline`
- `related`

This role set should not be expanded in first slice unless required by real implementation ambiguity.

## 8. Route ownership and projection rules

- `Service` is the only content owner of `/services/[slug]`.
- `Case` is the only content owner of `/cases/[slug]`.
- `Page` may project linked entities into a page composition, but does not replace or duplicate route truth.
- Public read-side renders projections; it does not author truth.
- Slug uniqueness must be enforced at least within entity type.

## 9. Structural readiness requirements

These are content-shape requirements, not full workflow rules.

### Service structural minimum

- valid slug
- title and H1
- service scope summary
- CTA variant
- at least one proof path

### Case structural minimum

- valid slug
- title
- location
- task
- work scope
- result
- at least one valid visual proof path

### Page structural minimum

- valid slug
- page type
- title and H1
- typed blocks or equivalent meaningful content body
- valid refs only

### Contacts page structural minimum

- `Page(type=contacts)` must resolve to confirmed contact truth from `Global Settings`
- if contact truth is not confirmed, page may exist as draft but is not publishable

## 10. Validation invariants

- broken refs are never publishable
- invalid route ownership is never publishable
- raw media URL linkage is never canonical truth
- empty proof shells are not publishable
- arbitrary custom block payloads are out of contract
- `Gallery` may be reused, but not overloaded into general content container

## 11. Relationship to admin PRD

This document narrows and operationalizes:

- `Entity model coverage for first slice`
- `Publish model and readiness gates`
- `SEO operations surface`
- `Media operations surface`
- `Уход от хардкода`

It does not reopen any product decision already fixed in the admin PRD.

## 12. Open questions allowed here

Допустимы только вопросы implementation detail уровня:

- exact field naming
- exact ref payload representation

Недопустимы как open questions:

- reopening entity set
- reopening typed-block posture
- reopening route ownership
- reopening whether admin is builder-first
- reopening `gallery` block into second media model
