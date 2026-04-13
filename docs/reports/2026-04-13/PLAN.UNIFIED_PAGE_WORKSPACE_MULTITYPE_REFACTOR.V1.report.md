# PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.V1.report

## 1. Executive Summary

For the `Страницы` domain, the recommended direction is not to create a second landing editor.  
The correct direction is to evolve the current `page workspace` into a one-surface multi-type editor.

Core idea:

- one editor surface
- multiple `page types`
- typed sections
- first-class source entities
- explicit inheritance / override / drift
- real-shell preview
- serial-production-ready workflow

The main shift versus older debate:

- the question is no longer `page vs service editor`
- the question is now `how one page workspace becomes a multi-type domain shell without losing source truth`

Recommended first practical target:

- `about`
- `contacts`
- `service_landing`
- `equipment_landing`

With:

- `equipment` as a first-class source entity
- `service`, `case`, `media`, `gallery` still first-class
- `geo_service_landing` deferred as a separate type
- `Page` owning the page instance while source domains own reusable truth

## 2. Source Docs Used

Required docs from the prompt were found and used:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md`
- `docs/engineering/TEST_DATA_CANON_Экостройконтинент_v1.md`
- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.LEGACY_DATA_REMOVAL_AND_FINAL_TOPUP.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.ANAMNESIS.EQUIPMENT_SERVICE_LANDING_UI.V1.report.md`
- `docs/reports/2026-04-13/PLAN.EQUIPMENT_SERVICE_LANDING_UI.REMEDIATION.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.SEO_OPERATOR.VARIANT_B_LANDING_OWNER_MODEL.V1.report.md`

Additionally used:

- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/engineering/LLM_STRUCTURED_OUTPUT_CONTRACT_v1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`

### Discrepancies

1. `PRD_Экостройконтинент_v0.3.1.md` is internally marked as `v0.3.2`.
2. In the PRD and some earlier docs, route ownership for `/services/[slug]` is still described through `Service`. For the current refactor direction, that wording is now insufficient and should be treated as older canon wording.
3. `PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md` correctly preserves the `one editor surface` rule, but its earlier wording was too tightly tied to static-page reading and therefore required a bounded update, not a rewrite.

## 3. Accepted Product Assumptions

This planning pass accepts the following as already decided:

1. editor surface must be one
2. a second competing editor is forbidden
3. pages must expand through `page types`, not new top-level screens
4. `equipment` is very likely required as a first-class source entity
5. source domains must not dissolve into page text
6. preview must show the real page shell
7. serial production is first-class
8. AI stays a secondary assistive layer

## 4. Why One Editor Surface Is Better Than Two Editors

One editor surface is better for three reasons.

### 4.1 Less ownership drift

When the same landing can be edited in two places, the team almost always gets:

- two save paths
- two preview contracts
- two truth models
- operator confusion

### 4.2 Better operator habit

The SEO operator needs one place where they:

- open the page
- see its structure
- attach sources
- check preview
- send to review

### 4.3 Better product scaling

Page types, typed sections, and readiness rules can scale inside one editor.  
Two editors scale not the product, but the chaos between them.

## 5. Domain Risks

Main risks of the new direction:

1. `Page` may become an overgrown flat monolith.
2. `equipment` may be introduced too weakly and fail to provide real value.
3. inheritance may become too complex.
4. readiness and verification may overload the first layer of the editor.
5. `Page/public shell` may quietly become a hidden second editor.

The most dangerous risk:

`one editor surface` remains true only in wording, while runtime still grows a shadow editing path.

## 6. Proposed Target Model

### 6.1 Canonical ownership

- `Page` owns page instance, page type, section composition, and page-level SEO/publication state
- source entities own reusable truth and facts
- public shell owns rendering shell only

### 6.2 First-wave page types

- `about`
- `contacts`
- `service_landing`
- `equipment_landing`

### 6.3 First-wave source entities

- `equipment`
- `service`
- `case`
- `media_asset`
- `gallery`

### 6.4 First-wave typed sections for commercial pages

- `hero_offer`
- `service_scope` or `equipment_summary`
- `geo_coverage`
- `proof_cases`
- `cta`

Useful next sections:

- `equipment_specs`
- `gallery`
- `faq`
- `advantages`

### 6.5 Inheritance model

Only three operator-visible states:

- `Inherited`
- `Overridden`
- `Outdated`

### 6.6 Create flow

Controlled modes:

- `Standalone`
- `From service`
- `From equipment`
- `Clone/adapt`

Geo should enter as a bounded mode inside landing creation, not as a first-wave separate page type.

### 6.7 Preview model

Preview must render:

- header
- hero in shell
- body
- footer

and must use the same projection logic as public rendering.

## 7. Comparison With Current State

Current state:

- one editor surface exists
- but it is still effectively static-page-first
- it lacks `equipment`
- it lacks typed commercial sections
- it lacks explicit inheritance
- it lacks true landing-grade preview and serial flow

Target state:

- one editor surface remains
- but it becomes multi-type
- source domains remain structured
- commercial landing assembly becomes native instead of improvised

### Net result

Current model is simpler, but insufficient.  
Target model is more complex, but product-correct and operator-useful.

## 8. Phased Rollout Recommendation

### Wave 1 - Foundation

Scope:

- decision/canon alignment
- page type expansion
- `equipment` entity
- typed landing sections
- create flow refactor
- real-shell preview baseline

### Wave 2 - Operator trust

Scope:

- inherited / overridden / outdated
- page-type readiness
- geo / proof / spec completeness
- preview markers

### Wave 3 - Scale

Scope:

- clone/adapt
- duplicate guardrails
- source drift visibility across registry
- AI by-section enrichment

### Recommendation

Do not start with AI or cosmetic preview polish.  
Start with ownership, page types, source entities, and typed sections.

## 9. Decision Summary

1. `One editor surface` stays non-negotiable.
2. Expansion axis is `page types`, not more screens.
3. `equipment` must be first-class.
4. `service_landing` and `equipment_landing` enter first wave.
5. `geo_service_landing` stays deferred as a separate type.
6. `Page` owns the page instance; source entities own reusable truth.
7. `Page/public shell` must not become a second editor.
8. Preview must become shell-faithful.

## 10. Open Questions

These remain open and should stay explicit:

1. Should `faq_item` and `review/testimonial` enter Wave 1 or wait for Wave 2?
2. Does `equipment_landing` always require an attached `service`, or can it ship as equipment-first with optional service binding?
3. Should clone/adapt start with duplication only, or include a more explicit adaptation wizard in the first scale wave?
4. Which exact fields should be override-allowed per source family in first implementation, to avoid overcomplicating inheritance?
5. Does the team want one shared landing section grammar for all commercial types, or one common grammar plus small page-type-specific section variants?

## 11. Recommended Next Implementation Epic

The next implementation epic should not be an AI wave and should not be UI polish.

It should be:

`Unified page workspace multi-type foundation`

Minimum scope:

1. enforce one-editor runtime/navigation canon
2. add first-wave page types
3. add `equipment` entity baseline
4. add first-wave typed sections for commercial pages
5. add controlled create modes
6. add real-shell preview baseline

This is the smallest epic that creates the correct foundation. Without it, all future improvements remain local patches on top of a static-page-first model.
