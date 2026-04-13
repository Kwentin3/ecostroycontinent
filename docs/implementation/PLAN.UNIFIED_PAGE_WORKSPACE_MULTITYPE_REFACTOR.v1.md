# PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.v1

Status: proposed design/refactor plan  
Date: 2026-04-13  
Basis: canonical PRD, single-workflow docs, page workspace audits, equipment landing diagnosis, Variant B operator audit, accepted one-editor product decision.

## 1. Goal and Boundaries

Goal:

- evolve one `page workspace` into a unified multi-type editor
- preserve the rule `one editor surface`
- avoid introducing a second competing landing editor
- avoid turning the workspace into a generic drag-and-drop page builder
- make the tool genuinely usable for an SEO specialist

This plan does:

- define the canonical ownership model
- define first practical wave page types
- define typed sections and source entity model
- define inheritance / override / drift behavior
- define create flow, preview/public shell, review/publish, and serial production flow
- define phased rollout

This plan does not:

- write code
- specify file-level implementation tasks
- rewrite the whole PRD
- reintroduce parallel editors
- propose "keep both editors"

## 2. Why One Editor Surface Is the Chosen Direction

`One editor surface` is a product requirement, not a preference.

Why:

1. The SEO operator needs one canonical place to open, assemble, preview, and hand off a page.
2. Two editors almost always create drift:
   - different ownership
   - different save paths
   - different preview contracts
   - different mental models
3. Product value should scale through:
   - `page types`
   - typed sections
   - source entities
   - inheritance rules
   - readiness logic

Conclusion:

- the surface remains one
- the domain expands by page type, not by adding new top-level screens

## 3. Current Model Insufficiency Recap

The current `page workspace` is viable as a static-page editor but insufficient for the service/equipment landing scenario.

Current gaps:

- page type taxonomy is still effectively standalone-page-first
- there is no first-class `equipment` source entity
- the section model is too thin for commercial / geo / proof rhythm
- preview does not show the real shell page
- serial production `equipment x geo x offer` is not supported
- some landing logic still lives adjacent to the page flow and risks reintroducing a second editor

The answer is not "add a few more fields" to the current static form.  
The answer is:

- keep one editor surface
- expand the `Page` domain into a multi-type model
- preserve source domains as first-class truth

## 4. Canonical Ownership Model

### Canonical Rule

`Unified page workspace` is the only operator/editor surface for pages of any supported type.

### `Page` owns

`Page` owns:

- `page_type`
- route-level page instance
- lifecycle
- section composition
- section ordering
- page-level SEO and publication state
- preview/public projection input
- page-level overrides
- review/publish handoff

### Source entities own

Source entities own reusable truth:

- `equipment`
- `service`
- `case`
- `media_asset`
- `gallery`
- later when justified: `faq_item`, `review`, `testimonial`

They do not own page composition and do not become a second landing editor.

### Public shell owns

Public shell owns only:

- header/footer
- public rendering shell
- canonical published read-side projection
- delivery concerns

Public shell does not own editable landing truth.

### Projection-only rule

If a route renders through public shell, the shell remains projection/container only, not a second owner.

## 5. Proposed Page Types

### First practical wave

1. `about`
2. `contacts`
3. `service_landing`
4. `equipment_landing`

### Why these four

- `about` and `contacts` already exist and must stay in the unified editor
- `service_landing` covers service-first commercial pages
- `equipment_landing` covers machine-first SEO pages

### Deferred as standalone type

`geo_service_landing` is not introduced as a first-wave page type.

Reason:

- it would bloat taxonomy too early
- geo should first live as a bounded mode inside `service_landing` / `equipment_landing`
- a separate type is justified only if geo pages later prove to have materially different rules

### Matrix 1 - Current vs target

| Concern | Current state | Target state | Why current is insufficient | Proposed remedy |
| --- | --- | --- | --- | --- |
| Editor surface | One page editor for static pages, adjacent landing logic elsewhere | One page editor for all supported page types | Current single editor covers only narrow static use | Expand by page types, not screens |
| Page types | `about`, `contacts` effectively only | `about`, `contacts`, `service_landing`, `equipment_landing` | No commercial landing taxonomy | Add explicit page type taxonomy |
| Source entities | `service`, `case`, `media`, `gallery`; no `equipment` | Add `equipment`, preserve other source domains | No machine-first source model | Introduce `equipment` as first-class entity |
| Sections | Narrow static composition | Typed section grammar by page type | Cannot model proof / geo / specs / commercial rhythm | Add typed sections with required / optional sets |
| Inheritance | Mostly absent | Explicit inherited / overridden / outdated | Source drift is invisible | Add source inheritance model |
| Preview | Body-first preview | Real-shell preview | Operator cannot trust commercial page output | Unify preview with public shell |
| Scale | Weak serial production | Clone/adapt with guardrails | `equipment x geo x offer` becomes manual pain | Add serial production flow |

## 6. Proposed Source Entities

### Required source entities

1. `equipment`
2. `service`
3. `case`
4. `media_asset`
5. `gallery`

### Recommended near-next supporting entities

1. `faq_item`
2. `review` / `testimonial`

### Should `equipment` become first-class?

Yes.

Without `equipment`, the editor cannot honestly support:

- machine-first intent
- specs
- suitability
- operator / no-operator variation
- media selection around a specific machine
- drift from technical characteristics

### Minimal `equipment` contract

Minimum practical contract:

- `slug`
- `title`
- `equipment_type`
- `short_summary`
- `capability_summary`
- `key_specs[]`
- `usage_scenarios[]`
- `operator_mode`
- `primary_media_asset_id`
- `gallery_ids[]`
- `related_case_ids[]`
- `service_refs[]`
- `seo_basics`
- optional `geo_availability_hints`

### Source entity principles

- source entities stay structured
- page consumes refs and derives candidate content from them
- page does not flatten source truth into raw text as the primary model

## 7. Typed Sections Model

### Common section grammar

Unified page workspace uses one common section grammar, but each page type gets a bounded section set.

Common section types:

- `hero_offer`
- `trust_strip`
- `rich_intro`
- `service_scope`
- `equipment_summary`
- `equipment_specs`
- `advantages`
- `geo_coverage`
- `proof_cases`
- `gallery`
- `faq`
- `process_steps`
- `cta`
- `contact`

### Section model rules

1. Sections are typed and ordered.
2. Page type defines:
   - required sections
   - optional sections
   - forbidden or irrelevant sections
3. Section order is page-owned.
4. Section content may be:
   - page-owned
   - inherited from source
   - inherited then overridden

### Matrix 2 - Page types and sections

| Page type | Intended use | Required sections | Optional sections | Required source entities | Readiness notes |
| --- | --- | --- | --- | --- | --- |
| `about` | Standalone trust/company page | `hero_offer`, `rich_intro`, `cta` or `contact` | `gallery`, `proof_cases`, `faq` | none required, optional `case`, `media`, `gallery` | Must have H1, intro, visible trust path, valid CTA/contact |
| `contacts` | Standalone contact/service-area page | `hero_offer`, `contact`, `geo_coverage` | `faq`, `rich_intro` | optional `media` | Must have contact truth, service area visibility, no hidden CTA-only shell |
| `service_landing` | Commercial page around service offer | `hero_offer`, `service_scope`, `advantages`, `geo_coverage`, `proof_cases`, `cta` | `gallery`, `faq`, `process_steps`, `trust_strip` | `service`, optional `equipment`, `case`, `media`, `gallery` | Must have one main intent, proof, geo relevance, CTA, no duplicate route semantics |
| `equipment_landing` | Commercial page built from one equipment source | `hero_offer`, `equipment_summary`, `equipment_specs`, `geo_coverage`, `proof_cases`, `cta` | `gallery`, `faq`, `process_steps`, `advantages` | `equipment`, optional `service`, `case`, `media`, `gallery` | Must show useful specs, suitability, geo context, proof, and CTA |

### First-wave scope rule

Do not introduce too many section types in the first wave.

First-wave mandatory sections for commercial landings:

- `hero_offer`
- `service_scope` or `equipment_summary`
- `geo_coverage`
- `proof_cases`
- `cta`

First-wave useful optional sections:

- `equipment_specs`
- `gallery`
- `faq`
- `advantages`

## 8. Inherited / Overridden / Outdated Model

### Ownership split inside a page

#### Inherited from source

Typical inherited candidates:

- equipment title hints
- capability summary
- key specs
- related cases
- primary media defaults
- service summary hints
- gallery defaults

#### Page-owned

Always page-owned:

- section order
- connective transitions
- commercial emphasis
- geo targeting
- CTA framing
- final SEO fields
- final preview/public composition

#### Override-allowed

Page may override:

- hero phrasing derived from service/equipment
- summary wording
- section-level titles
- selected proof subset
- inherited spec presentation text

### Operator-visible states

Operator must see only three states:

- `Inherited`
- `Overridden`
- `Outdated`

### Behavior rules

- `Inherited`: page follows source value
- `Overridden`: page detached from source for this field/slot
- `Outdated`: source changed after the page inherited or partially inherited the data

### Drift handling

When source changes:

- page should not silently rewrite commercial copy
- affected inherited fields should get `Outdated`
- operator should see what changed and where review is needed
- operator should be able to accept source update or keep override

### Matrix 3 - Source ownership

| Domain/source | Owns what | Page inherits what | Page may override what | Drift risk | Operator visibility needed |
| --- | --- | --- | --- | --- | --- |
| `equipment` | machine truth, specs, media defaults, suitability hints | summary hints, specs, primary media, related proof candidates | hero phrasing, selective spec framing, chosen proof subset | High | inherited / overridden / outdated markers at field and section level |
| `service` | reusable service truth, scope, baseline offer hints | service summary, scope bullets, offer hints | final hero angle, local emphasis, CTA framing | Medium | source badge, changed-source marker, accept-update action |
| `case` | proof truth | case refs, snippets, previews | ordering, subset, surrounding copy | Medium | linked proof set with changed-source signal |
| `media_asset` | asset truth | selected hero/body media refs | placement, crop intent, ordering | Low to Medium | selected usage context and stale reference signal |
| `gallery` | curated set | default gallery refs | subset, ordering, captions | Medium | source vs page-curated distinction |

## 9. Create Flow Model

Create flow must remain controlled and lightweight.

### Supported create modes

1. `Standalone`
2. `From service`
3. `From equipment`
4. `Clone/adapt`

### Why not "from geo" as a separate mode in wave 1

Geo is not a separate source domain.  
It is a bounded page parameter / targeting layer and should remain inside landing creation or clone/adapt.

### Create flow outline

1. Pick page type.
2. Pick create mode.
3. Attach primary source if the type requires it.
4. Set core intent:
   - offer angle
   - geo target
   - primary CTA intent
5. Start from a bounded typed-section scaffold.
6. Land directly inside the unified workspace.

### UX constraints

- create flow must not feel like a wizard maze
- it must collect only the minimum needed to produce a useful initial scaffold
- rare metadata stays in metadata modal, not in step one

## 10. Preview / Public Shell Model

Preview must be shell-faithful.

### Required preview behavior

- render header
- render hero in shell
- render body
- render footer
- use the same projection logic as public rendering
- support device states relevant to commercial pages

### Why this matters

SEO operators need to decide based on the real page, not a body fragment.  
Without shell fidelity, first-screen hierarchy, CTA placement, and page rhythm remain untrustworthy.

### Readiness markers near preview

Preview area should surface compact readiness markers such as:

- missing required section
- missing required source
- duplicate-risk warning
- stale inherited content

These markers must stay compact and not turn the screen into a diagnostics cockpit.

## 11. Review / Publish / Lifecycle Implications

Lifecycle remains page-owned.

### Canonical rule

There must be only one truth path for review/publish: through `Page`.

### Implications

- review is requested from the unified page workspace
- publish state lives on `Page`
- page-type-specific readiness rules must gate review/publish
- source entities remain reusable truth, not publication owners for the page

### Readiness examples

- `about`: H1, intro, CTA/contact present
- `contacts`: contact truth and geo coverage present
- `service_landing`: offer, geo, proof, CTA present
- `equipment_landing`: equipment source, useful specs, proof, CTA present

## 12. Series Production Model

Serial production is a first-class requirement.

### Required flow

- clone a page
- adapt offer / geo / proof / CTA
- keep useful inherited source links
- prevent silent duplicate SEO artifacts

### Registry implications

The page registry must scale beyond one-off editing:

- fast filtering by page type
- fast filtering by source entity
- status visibility
- stale-source visibility
- duplicate-risk visibility

### Duplicate guardrails

Guardrails are required for:

- `slug`
- H1
- title
- meta description
- canonical intent
- geo overlap

Guardrails should warn, not guess silently.

## 13. AI Role in the New Model

AI remains secondary.

### AI may help

- propose hero variants
- tighten CTA copy
- draft FAQ answers
- draft connective transitions
- reframe copy for a local angle

### AI context should include

- page type
- attached source refs
- current section content
- geo target
- operator-selected goal for the section

### AI must never own

- route truth
- source truth
- publish authority
- duplicate-risk decisions
- hidden overrides

## 14. Proposed Phased Rollout

### Matrix 4 - Rollout phasing

| Wave | Scope | Why now | Dependencies | Main risks | Exit criteria |
| --- | --- | --- | --- | --- | --- |
| Wave 1 | canon alignment, page type expansion, `equipment` baseline, first-wave typed sections, controlled create modes, real-shell preview baseline | Establish correct ownership and first usable commercial model | decision note, bounded canon updates | underpowered `equipment`, overcomplicated create flow | one workspace can create `about`, `contacts`, `service_landing`, `equipment_landing` with shell-faithful preview |
| Wave 2 | inheritance / override / outdated, page-type readiness, proof/geo/spec completeness, compact preview markers | Add operator trust and maintainability | Wave 1 contracts | inheritance becomes too heavy | operator can understand source-derived state and resolve drift without ambiguity |
| Wave 3 | clone/adapt, duplicate guardrails, registry scale affordances, source-drift visibility across many pages, section-scoped AI help | Support scale and daily production | Wave 2 state model | registry becomes noisy, AI overreach | series production works without manual chaos and without a second editing path |

## 15. Risks and Mitigations

### Risk 1 - `Page` becomes a flat monster

Mitigation:

- expand by page type and typed sections
- keep section grammar bounded
- keep rare fields in metadata modal

### Risk 2 - `equipment` is introduced too weakly

Mitigation:

- define a minimum practical contract
- do not ship `equipment_landing` without specs/media/proof hooks

### Risk 3 - inheritance becomes too heavy

Mitigation:

- only three operator-visible states
- no deep diff cockpit in the first layer
- compact accept/keep actions

### Risk 4 - diagnostics overwhelm the editor

Mitigation:

- keep readiness markers compact and contextual
- avoid trace-like panels in the main workspace

### Risk 5 - a shadow second editor returns through preview or shell

Mitigation:

- keep public shell projection-only
- keep review/publish on `Page`
- reject any manual editing path outside the unified workspace

## 16. What Stays Explicitly Out of Scope

Out of scope for the first practical wave:

- a generic drag-and-drop page builder
- a separate `geo_service_landing` type
- full AI-led page assembly
- a broad PRD rewrite
- exhaustive diagnostics-first UI
- flattening source entities into page text blobs

## 17. Recommended First Implementation Wave

Recommended first implementation wave:

1. Enforce one-editor runtime and navigation canon.
2. Add first-wave page types:
   - `about`
   - `contacts`
   - `service_landing`
   - `equipment_landing`
3. Add baseline `equipment` source entity.
4. Add first-wave typed landing sections.
5. Add controlled create modes.
6. Add real-shell preview baseline.

This is the smallest wave that creates the correct foundation without introducing a second editor or bloating the current static-page model.
