# DECISION.UNIFIED_PAGE_WORKSPACE_MULTITYPE_OWNER_MODEL.v1

Status: accepted product decision  
Date: 2026-04-13  
Purpose: fix the canon for one unified multi-type page workspace in the `Страницы` domain.

## 1. Decision

For the `Страницы` domain in `Экостройконтинент`, the accepted canon is:

1. There is exactly one canonical operator/editor surface: `unified page workspace`.
2. A second competing landing editor is not allowed.
3. Domain expansion must happen through:
   - `page types`
   - typed sections
   - first-class source entities
   - inherited / overridden / outdated logic
   - readiness / publish rules
   - preview / public shell fidelity
4. Domain expansion must not happen through:
   - a second editor surface
   - a generic no-code builder
   - flattening source domains into page text

## 2. Canonical Page Types

First practical wave:

- `about`
- `contacts`
- `service_landing`
- `equipment_landing`

Not first-wave by default:

- `geo_service_landing` as a separate page type

Reason:

- geo variation should first live as a bounded landing mode inside `service_landing` or `equipment_landing`
- a separate geo page type is justified only if it later proves to have materially different readiness, inheritance, and publication rules

## 3. Ownership Model

### `Page` owns

After multi-type expansion, `Page` owns:

- route-level page instance
- `page_type`
- lifecycle `Draft -> Review -> Published`
- page-level composition
- typed section ordering
- page-level SEO and publication state
- preview/public projection input
- page-level overrides over source-derived content

### Source entities own

Source entities stay first-class and own reusable source truth:

- `equipment`
- `service`
- `case`
- `media_asset`
- `gallery`
- later when justified: `faq_item`, `review`, `testimonial`

They do not become a second landing editor and do not own page composition.

### Public shell owns

Public shell owns:

- header and footer
- route rendering shell
- canonical published projection
- delivery-layer concerns

Public shell does not own editorial truth and must not provide a second manual editing path.

## 4. Preview Rule

Preview must show the real public page in shell:

- header
- hero in shell
- body
- footer
- page-type-relevant device states

Preview must not remain an abstract body-only fragment.

## 5. Source-Domain Rule

Source domains do not dissolve into page text.

This means:

- `equipment` becomes a first-class source entity
- `service`, `case`, `media`, and `gallery` remain first-class
- page editing works with refs, inheritance, and overrides instead of copy-paste as the primary model

## 6. No Second Editor Rule

The following models are explicitly forbidden:

- `page editor` plus `service landing editor` as two equal editing surfaces
- `page workspace` plus `AI landing workspace` as two owner workflows
- `public shell` with editable landing truth
- "keep both and let the team choose"

If any document, screen, or implementation plan introduces a second competing editor for landing pages, it is out of canon and must be aligned back to this decision.

## 7. AI Role

AI remains a secondary assistive layer:

- section-scoped help
- rewrite / tighten / CTA / FAQ / bridge assistance
- no second truth path
- no publish authority
- no compensation for a missing domain model

## 8. Immediate Documentation Consequence

This decision narrows how existing docs must now be read:

- `PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md` remains valid as the `one editor surface` canon
- it must now be read as canon for a multi-type page workspace, not only for standalone static pages
- older wording that treats `Page` only as the owner of `about` / `contacts` is insufficient for the target model and requires bounded follow-up maintenance, not a broad PRD rewrite
