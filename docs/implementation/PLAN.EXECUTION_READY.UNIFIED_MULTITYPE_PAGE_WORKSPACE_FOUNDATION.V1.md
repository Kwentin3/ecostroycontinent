# PLAN.EXECUTION_READY.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1

Status: proposed execution-ready foundation plan  
Date: 2026-04-13  
Purpose: define the exact first implementation wave for the unified multi-type page workspace so a later agent can execute it without reopening key product decisions.

## 1. Goal and Boundaries

This document defines the first implementation wave for the unified multi-type page workspace.

The goal of this wave is not to finish the whole multi-type vision. The goal is to create a correct and safe foundation that:

- keeps one canonical editor surface
- introduces first-wave page types
- introduces the minimum honest `equipment` source model
- introduces first-wave typed sections for commercial pages
- introduces a fast but domain-correct create flow
- introduces a shell-faithful preview baseline
- prevents hidden second-editor drift during implementation

This wave is explicitly not:

- a generic drag-and-drop builder
- a second landing editor
- a broad rewrite of all product docs
- a full inheritance/drift cockpit
- a full series-production and duplicate-governance system

## 2. Accepted Canon and Constraints

The following are already accepted and must not be reopened:

1. There is one canonical operator/editor surface: unified page workspace.
2. A second competing landing editor is forbidden.
3. Expansion happens through:
   - page types
   - typed sections
   - first-class source entities
   - inherited / overridden / outdated logic
   - readiness / publish rules
   - preview / public shell fidelity
4. Expansion does not happen through:
   - a second editor surface
   - a generic no-code builder
   - dissolving source domains into page text
5. `equipment` is treated as a first-class source entity.
6. First-wave page types are fixed:
   - `about`
   - `contacts`
   - `service_landing`
   - `equipment_landing`
7. `geo_service_landing` is not a separate first-wave type.
8. Preview must show the real page in shell, not body only.

## 3. First-Wave Scope

### In scope

- extend `Page` to support first-wave multi-type taxonomy
- add baseline `equipment` entity to content core
- extend page source attachments to include `equipment`
- introduce first-wave typed sections for all supported page types
- add controlled create modes:
  - `Standalone`
  - `From service`
  - `From equipment`
  - `Clone/adapt`
- add a shell-faithful preview baseline
- add one-editor runtime and navigation guardrails
- define a Russian GUI naming baseline for all first-layer operator surfaces

### Out of scope for this wave

- full field-level `outdated` comparison UX
- clone/adapt wizard with deep adaptation automation
- duplicate-risk engine across the whole registry
- geo as a separate entity or standalone page type
- AI-led page assembly
- major redesign of all current admin screens

## 4. Domain/Model Changes Required

### 4.1 `Page` after first-wave expansion

`Page` remains the page instance owner and now must own:

- `page_type`
- route-level page instance
- lifecycle `Draft -> Review -> Published`
- section composition
- section ordering
- page-level SEO and publication state
- page-level preview/public projection input
- page-level source attachments
- page-level geo targeting fields
- page-level overrides over source-derived defaults

### 4.2 `Page` model delta for first wave

Minimum practical additions/changes:

- extend `page_type` enum with:
  - `service_landing`
  - `equipment_landing`
- add structured `sections[]` for typed page sections
- add `primary_source`:
  - `kind`
  - `entity_id`
- add grouped `source_refs`
  - `services[]`
  - `equipment[]`
  - `cases[]`
  - `media_assets[]`
  - `galleries[]`
- add page-level geo targeting fields:
  - `geo_label`
  - `geo_scope`
  - `service_area_note`
- keep page-owned SEO fields on `Page`

### 4.3 What source entities own

Source entities own reusable truth and facts. They do not own page composition.

First-wave source owners:

- `service`
- `equipment`
- `case`
- `media_asset`
- `gallery`

### 4.4 Exact minimum contract for `equipment`

This is the minimum honest `equipment` contract for first wave:

- `slug`
- `locale`
- `status`
- `title`
- `equipment_type`
- `short_summary`
- `capability_summary`
- `key_specs[]`
- `usage_scenarios[]`
- `operator_mode`
- `primary_media_asset_ref`
- `gallery_refs[]`
- `related_case_refs[]`
- `service_refs[]`

### 4.5 Why this is the minimum and not symbolic

Without these fields, `equipment_landing` cannot honestly support:

- machine-first intent
- useful equipment summary
- visible specs
- operator/no-operator promise
- machine-specific media
- linked proof
- relation to service context

Anything smaller would create only a label named `equipment`, not a useful source entity.

### 4.6 Likely implementation touchpoints

Primary code zones likely affected in this wave:

- `lib/content-core/content-types.js`
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/admin/page-workspace.js`
- `lib/content-ops/readiness.js`
- `lib/admin/page-registry-records.js`
- `lib/admin/page-registry-create.js`
- `lib/read-side/public-content.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageMetadataModal.js`
- `components/admin/PreviewViewport.js`
- `components/public/PublicRenderers.js`
- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`

Legacy adjacent zones that must be contained or reclassified:

- `components/admin/ServiceLandingWorkspacePanel.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `lib/landing-factory/service.js`
- `app/api/admin/entities/service/landing-factory/generate/route.js`

## 5. Matrix 1 - Current vs Target Foundation

| Concern | Current state | Target first-wave state | Why current is insufficient | First-wave remedy |
| --- | --- | --- | --- | --- |
| Editor surface | One page editor, but effectively static-page-first | One page editor for four supported page types | Current surface does not honestly support commercial landing work | Extend one editor by page types and typed sections |
| Page taxonomy | `about`, `contacts` only | `about`, `contacts`, `service_landing`, `equipment_landing` | No commercial page taxonomy | Extend page type enum and registry/create flow |
| Source model | `service`, `case`, `media`, `gallery`; no `equipment` | Add first-class `equipment` | No machine-first source truth | Add baseline `equipment` entity and picker support |
| Sections | Narrow static composition | Typed sections per page type | No structured commercial rhythm | Add bounded typed sections |
| Create flow | Static-page create flow | Controlled create modes | Wrong start posture for landing work | Add source-aware create/start flow |
| Preview | Body-first preview via `StandalonePage` | Real shell preview baseline | SEO operator cannot trust page output | Render preview through shell-faithful public composition |
| Guardrails | Legacy adjacent landing tooling still exists | One-editor runtime/navigation rule enforced | Hidden second editor risk | Constrain or integrate adjacent landing tooling |

## 6. Page Type Model

### 6.1 First-wave page types

Supported page types:

1. `about`
2. `contacts`
3. `service_landing`
4. `equipment_landing`

### 6.2 What stays common across all page types

Common across all page types:

- one registry
- one workspace route
- one metadata modal
- one review/publish path
- one preview surface
- one lifecycle model

### 6.3 What changes by page type

Varies by page type:

- required section set
- allowed source attachments
- readiness rules
- create mode defaults
- shell preview composition details

### 6.4 Required fields by page type

#### `about`

- fixed page type
- fixed route semantics
- title / H1 / intro
- sections[]
- page SEO

#### `contacts`

- fixed page type
- fixed route semantics
- title / H1 / intro
- sections[]
- page SEO
- contact/global settings dependencies

#### `service_landing`

- page type
- slug
- title / H1
- primary service source
- sections[]
- geo targeting fields
- CTA fields
- page SEO

#### `equipment_landing`

- page type
- slug
- title / H1
- primary equipment source
- sections[]
- geo targeting fields
- CTA fields
- page SEO

### 6.5 Minimal readiness rules by type

#### `about`

- H1 present
- intro present
- at least one action path or contact path present

#### `contacts`

- H1 present
- contact section present
- global phone exists
- service area exists

#### `service_landing`

- primary service attached
- hero offer present
- service scope present
- geo coverage present
- proof section present
- CTA present

#### `equipment_landing`

- primary equipment attached
- hero offer present
- equipment summary present
- equipment specs present
- geo coverage present
- proof section present
- CTA present

## 7. Source Entity Model

### 7.1 First-wave source entities

- `service`
- `equipment`
- `case`
- `media_asset`
- `gallery`

### 7.2 What is inherited in first wave

First-wave inherited defaults should be limited and understandable.

#### Inherited from `service`

- service title hint
- short summary / scope bullets
- related cases candidate set

#### Inherited from `equipment`

- equipment title hint
- capability summary
- key specs
- primary media candidate
- gallery candidate set
- related cases candidate set

#### Inherited from `case`

- case preview cards / proof cards

#### Inherited from `gallery` and `media_asset`

- selected asset refs
- primary image defaults

### 7.3 What is page-owned from day one

Always page-owned in first wave:

- final slug for commercial page types
- final H1
- final hero offer wording
- geo coverage wording
- CTA wording and CTA priority
- section ordering
- connective text between sections
- final selected proof subset
- final selected media placement
- final SEO fields

### 7.4 What page may override in first wave

Foundation-wave override support should be practical, not ambitious.

Allowed override cases:

- hero title derived from source
- short summary derived from source
- section heading text
- selected proof subset
- displayed spec phrasing

Wave 1 does not need a full explicit per-field override console. It only needs the data model to allow page-owned values to replace inherited defaults where needed.

### 7.5 Matrix 3 - Source ownership

| Source/domain | Owns what | Page inherits what | Page may override what | What operator must see |
| --- | --- | --- | --- | --- |
| `service` | service truth, offer baseline, scope baseline | service title hint, scope bullets, proof candidates | hero angle, local emphasis, CTA framing | badge `Из услуги`, attached service name |
| `equipment` | machine truth, specs, capability baseline, machine media baseline | equipment summary, specs, primary media, proof candidates | hero phrasing, selected specs framing, chosen proof subset | badge `Из техники`, attached equipment name |
| `case` | proof truth | case cards/snippets | ordering and subset | section note `Кейсы из источника` |
| `media_asset` | asset truth | chosen image refs | placement and ordering | clear placement context `Главное фото` / `Галерея` |
| `gallery` | curated asset set | gallery refs | subset and ordering | distinction between gallery source and page selection |

## 8. Typed Sections Model

### 8.1 Section design rule

First-wave sections must be:

- typed
- ordered
- bounded
- reusable
- simple enough to render in one editor without becoming a mega-form

### 8.2 Common technical section IDs

Technical section IDs for first wave:

- `hero_offer`
- `rich_intro`
- `service_scope`
- `equipment_summary`
- `equipment_specs`
- `advantages`
- `geo_coverage`
- `proof_cases`
- `gallery`
- `faq`
- `cta`
- `contact`

### 8.3 Exact mandatory sections for `service_landing`

Mandatory:

- `hero_offer`
- `service_scope`
- `geo_coverage`
- `proof_cases`
- `cta`

Optional in wave 1:

- `advantages`
- `gallery`
- `faq`

### 8.4 Exact mandatory sections for `equipment_landing`

Mandatory:

- `hero_offer`
- `equipment_summary`
- `equipment_specs`
- `geo_coverage`
- `proof_cases`
- `cta`

Optional in wave 1:

- `advantages`
- `gallery`
- `faq`

### 8.5 First-wave sections for `about`

Mandatory:

- `hero_offer`
- `rich_intro`
- `cta` or `contact`

Optional:

- `proof_cases`
- `gallery`

### 8.6 First-wave sections for `contacts`

Mandatory:

- `hero_offer`
- `contact`
- `geo_coverage`

Optional:

- `rich_intro`
- `faq`

### 8.7 Matrix 2 - Page types and minimal contracts

| Page type | Intended use | Required sections | Optional sections | Required source entities | Minimal readiness rules |
| --- | --- | --- | --- | --- | --- |
| `about` | company trust page | `hero_offer`, `rich_intro`, `cta` or `contact` | `proof_cases`, `gallery` | none | H1, intro, action/contact path |
| `contacts` | contact and service-area page | `hero_offer`, `contact`, `geo_coverage` | `rich_intro`, `faq` | none, but depends on global settings | H1, contact truth, service area |
| `service_landing` | service-first commercial page | `hero_offer`, `service_scope`, `geo_coverage`, `proof_cases`, `cta` | `advantages`, `gallery`, `faq` | `service` | service attached, geo, proof, CTA |
| `equipment_landing` | machine-first commercial page | `hero_offer`, `equipment_summary`, `equipment_specs`, `geo_coverage`, `proof_cases`, `cta` | `advantages`, `gallery`, `faq` | `equipment` | equipment attached, specs, geo, proof, CTA |

## 9. Create/Start Flow Model

### 9.1 Create modes

First-wave create modes:

1. `Standalone`
2. `From service`
3. `From equipment`
4. `Clone/adapt`

### 9.2 Minimum inputs by create mode

#### `Standalone`

Minimum inputs:

- page type
- working title if not fixed by type

For `about` and `contacts`, the system may prefill fixed route semantics.

#### `From service`

Minimum inputs:

- page type = `service_landing`
- primary service
- working title
- optional geo label

#### `From equipment`

Minimum inputs:

- page type = `equipment_landing`
- primary equipment
- working title
- optional geo label
- optional linked service

#### `Clone/adapt`

Minimum inputs:

- source page
- new page type if changing
- new working title
- new slug for commercial pages
- optional geo label

### 9.3 How geo enters first wave

Geo enters as page-level targeting input, not as a separate page type.

Foundation-wave geo fields:

- `geo_label`
- `geo_scope`
- `service_area_note`

Examples:

- city
- district
- delivery zone
- local commercial emphasis

### 9.4 Fast but domain-correct create flow

The create flow must:

- ask only for the minimum to create a useful scaffold
- prefill sections based on page type
- attach the primary source immediately when needed
- land the operator directly in the page workspace

The create flow must not:

- ask for all metadata up front
- ask for deep diagnostics up front
- force a long wizard

## 10. Preview/Public Shell Baseline

### 10.1 Minimal preview baseline that operators can trust

First-wave preview must render:

- header
- hero in shell
- body sections
- footer

It must use the same composition direction as public rendering.

### 10.2 Minimal preview states that matter in wave 1

Required:

- desktop
- mobile

Allowed but not exit-critical:

- tablet

### 10.3 Compact readiness markers

Preview-adjacent readiness must stay compact.

Foundation-wave markers may include:

- missing primary source
- missing required section
- missing contact/service-area truth for `contacts`
- shell preview unavailable

Do not add a full diagnostics cockpit in wave 1.

### 10.4 Implementation-safe preview rule

The preview baseline may start by composing through the same public renderer stack used by public routes, but with admin-side draft data injected into the same shell shape.

The preview baseline must not:

- stay on `StandalonePage` for all types
- invent a second rendering contract unrelated to public pages

## 11. One-Editor Guardrails

### 11.1 Runtime and navigation rules

Must remain true after the wave:

- page create/edit happens only through page routes
- page review/publish remains page-owned
- no service editor route may become a second page editor
- no preview shell may become editable truth

### 11.2 Legacy adjacent tooling treatment

Existing service landing tooling must be treated in one of two ways:

1. integrated as assistive/helper logic inside page workspace, or
2. kept internal/legacy with no competing operator entry point

It must not remain as a peer editor.

### 11.3 Guardrails to implement in docs/runtime

- keep decision note as binding canon
- keep `PAGES_SINGLE_WORKFLOW` as binding UX rule
- do not expose new top-level navigation for a second landing workspace
- if legacy tooling remains, label it as internal helper/legacy and remove any owner posture

### 11.4 How not to create a hidden second editor

Do not allow:

- editable page composition in public shell
- separate landing composition owned by `service`
- a new registry for landing pages outside `Страницы`
- a second create flow that bypasses page create flow

## 12. Operator UX Baseline

### 12.1 How to avoid a heavy mega-form

The editor stays understandable if the first layer shows:

- page identity
- source attachments
- ordered sections
- compact readiness hints
- preview

The editor becomes too heavy if the first layer shows:

- all metadata
- full diff diagnostics
- all source relations as giant lists
- AI/protocol/debug details

### 12.2 Russian GUI baseline

All first-layer user-facing labels should be Russian where a simple Russian label exists.

### 12.3 Matrix 4 - GUI language / naming baseline

| Technical term | Proposed user-facing Russian label | Where shown in UI | Notes |
| --- | --- | --- | --- |
| workspace | `Рабочий экран` | page header, help text | Avoid `workspace` in first layer |
| page type | `Тип страницы` | create flow, metadata | Stable across all types |
| service_landing | `Страница услуги` | registry, create flow, metadata | Do not show raw enum in first layer |
| equipment_landing | `Страница техники` | registry, create flow, metadata | Helper text may clarify commercial use |
| source | `Источник` | left rail, section badges | Use one label consistently |
| from service | `Из услуги` | create flow | Short and clear |
| from equipment | `Из техники` | create flow | Short and clear |
| standalone | `Без привязки` | create flow | Better than raw `Standalone` |
| clone/adapt | `Копировать и адаптировать` | create flow | Explain intent, not implementation |
| preview | `Предпросмотр` | preview panel | Stable label |
| readiness | `Готовность` | status chip, hints | Avoid `readiness` in first layer |
| inherited | `Из источника` | section badge, helper text | First-wave badge |
| overridden | `Изменено вручную` | later wave or helper text | Reserve exact wording now |
| outdated | `Источник изменился` | later wave or helper text | Reserve exact wording now |
| hero_offer | `Первый экран` | section title | Better than `hero` in first layer |
| service_scope | `Что входит в услугу` | section title | Commercial and clear |
| equipment_summary | `О технике` | section title | Human-readable |
| equipment_specs | `Характеристики техники` | section title | Must be explicit |
| proof_cases | `Кейсы` | section title | Short and familiar |
| geo_coverage | `Где работаем` | section title | Preferred over technical geo jargon |
| cta | `Призыв к действию` or `Действие` | section title, helper text | Short version may be used in narrow spaces |

### 12.4 Operator-facing helper texts to define in wave 1

Must be designed early:

- create mode helper text
- source attachment empty states
- compact readiness hints
- section descriptions for commercial pages
- preview mode labels

## 13. Rollout Steps

### Matrix 5 - Rollout wave

| Step | Scope | Why now | Main dependencies | Main risks | Exit criteria |
| --- | --- | --- | --- | --- | --- |
| 1 | Lock canon and runtime guardrails | Prevent hidden second editor before code expansion | decision note, single-workflow doc | legacy tooling remains peer editor | only page routes remain canonical page editor entry |
| 2 | Extend page type taxonomy | Foundation of all later behavior | content-core enums, schemas, registry UI | static assumptions break tests | all four page types can be created and loaded |
| 3 | Add baseline `equipment` entity | Honest source model for machine-first pages | content-core schemas and admin entity plumbing | too-weak contract | equipment source exists with minimum fields and refs |
| 4 | Add first-wave typed sections | Prevent mega-form and support commercial rhythm | page schema, workspace UI, renderer wiring | section sprawl | required sections scaffold correctly per page type |
| 5 | Refactor create/start flow | Make the model usable for operators | registry create UI, metadata defaults, source selectors | wizard bloat | each create mode produces a useful scaffold quickly |
| 6 | Add real-shell preview baseline | Restore operator trust in preview | public renderer composition, admin preview contract | second rendering contract drift | preview shows header/body/footer for all first-wave page types |
| 7 | Add compact readiness baseline | Keep publish flow safe without cockpit overload | page-type rules, preview hints, review path | too much diagnostics | missing essentials are surfaced compactly and review remains page-owned |

### Recommended execution order

Recommended order for implementation:

1. Step 1
2. Step 2
3. Step 3
4. Step 4
5. Step 5
6. Step 6
7. Step 7

This order reduces rework because:

- page type and source contracts must exist before workspace scaffolds
- create flow should target the final first-wave scaffold, not an intermediate shape
- preview should be built after the section model exists

## 14. Risks

### Risk 1 - page becomes a flat mega-form

Mitigation:

- use typed sections from the start
- keep metadata modal for secondary fields
- do not expose all source relations inline by default

### Risk 2 - `equipment` is nominal, not useful

Mitigation:

- enforce the exact minimum contract above
- do not ship `equipment_landing` without specs, media, and proof hooks

### Risk 3 - hidden second editor survives

Mitigation:

- no parallel navigation entry
- no publish path outside `Page`
- legacy service landing tooling only as helper or legacy internal path

### Risk 4 - preview remains untrustworthy

Mitigation:

- compose preview through the same shell direction as public rendering
- make desktop and mobile shell preview part of exit criteria

### Risk 5 - Russian GUI baseline is ignored during implementation

Mitigation:

- define labels now
- treat raw English enums as internal only
- add GUI naming review to implementation checklist

## 15. What Stays Deliberately Out of Scope

Leave these for Wave 2 or later:

- full `outdated` UX
- field-level inheritance inspector
- duplicate guardrails across many pages
- adaptation wizard
- `geo_service_landing` as separate type
- AI-led generation workflow
- advanced commercial diagnostics and scorecards

## 16. Recommended Next Implementation Epic

Recommended next implementation epic:

`Unified multi-type page workspace foundation`

Minimum objective:

- make one page workspace capable of creating and editing:
  - `about`
  - `contacts`
  - `service_landing`
  - `equipment_landing`
- with:
  - first-wave source attachments
  - first-wave typed sections
  - fast create modes
  - shell-faithful preview
  - one-editor guardrails

This is the smallest epic that creates the correct foundation without bloating the current static-page model and without reintroducing a second editor.
