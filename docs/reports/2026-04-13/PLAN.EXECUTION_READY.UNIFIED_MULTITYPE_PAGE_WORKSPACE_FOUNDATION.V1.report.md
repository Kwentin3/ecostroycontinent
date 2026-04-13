# PLAN.EXECUTION_READY.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1.report

## 1. Executive Summary

This planning pass turns the earlier unified multi-type direction into an execution-ready first-wave plan.

The core implementation message is simple:

- do not build a second landing editor
- do not stretch the old static-page model with random fields
- do build one stronger page workspace through:
  - first-wave page types
  - first-wave source entities
  - first-wave typed sections
  - a source-aware create flow
  - a shell-faithful preview baseline

The wave is intentionally narrow. It is not trying to deliver the whole inheritance/drift/scale story at once.

## 2. Source Docs Used

Primary docs used:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/product-ux/DECISION.UNIFIED_PAGE_WORKSPACE_MULTITYPE_OWNER_MODEL.v1.md`
- `docs/implementation/PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.v1.md`
- `docs/reports/2026-04-13/PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.V1.report.md`

Supporting docs used:

- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-13/AUDIT.ANAMNESIS.EQUIPMENT_SERVICE_LANDING_UI.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.SEO_OPERATOR.VARIANT_B_LANDING_OWNER_MODEL.V1.report.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md`
- `docs/engineering/TEST_DATA_CANON_Экостройконтинент_v1.md`

Implementation-support context also checked:

- `lib/content-core/content-types.js`
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/admin/page-workspace.js`
- `lib/content-ops/readiness.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageMetadataModal.js`
- `components/public/PublicRenderers.js`
- `components/admin/ServiceLandingWorkspacePanel.js`
- `components/admin/ServiceLandingFactoryPanel.js`

### Discrepancies

1. `PRD_Экостройконтинент_v0.3.1.md` is internally marked as `v0.3.2`.
2. PRD and older contracts still describe `/services/[slug]` ownership through `Service` in older wording; that is insufficient for the new unified page-workspace planning direction and should be treated as older canon wording.
3. The current repo still contains legacy-adjacent service landing tooling, which is exactly why one-editor guardrails are part of the foundation scope.

## 3. Accepted Canon and Constraints

Already fixed and not reopened:

1. One canonical editor surface.
2. No second competing landing editor.
3. `equipment` is first-class.
4. First-wave page types are:
   - `about`
   - `contacts`
   - `service_landing`
   - `equipment_landing`
5. `geo_service_landing` is deferred.
6. Preview must show the real shell page.
7. First-layer GUI should be operator-friendly and primarily Russian.

## 4. First-Wave Scope

First wave must deliver:

- extended page taxonomy
- baseline `equipment` source entity
- baseline page/source relation model
- first-wave typed sections
- create/start flow with controlled modes
- shell preview baseline
- one-editor runtime/navigation guardrails
- Russian naming baseline for first-layer UI

It must not try to deliver:

- full drift inspection
- series-production duplicate engine
- AI-led page building
- a broad doc rewrite

## 5. Domain/Model Changes Required

### `Page`

`Page` must become the owner of:

- page instance
- page type
- sections
- page-level source attachments
- geo targeting
- page-level SEO/publication truth

### `equipment`

Wave 1 requires a real `equipment` entity with:

- identity
- summary
- specs
- operator mode
- media refs
- proof refs
- service refs

Anything less is symbolic and will not support an honest `equipment_landing`.

## 6. Page Type Model

Final first-wave taxonomy:

- `about`
- `contacts`
- `service_landing`
- `equipment_landing`

Common across all types:

- one registry
- one workspace
- one review/publish path
- one preview posture

Different by type:

- required sections
- required source attachments
- readiness rules
- create defaults

## 7. Source Entity Model

First-wave source entities:

- `service`
- `equipment`
- `case`
- `media_asset`
- `gallery`

Recommended later supporting entities:

- `faq_item`
- `review` / `testimonial`

First-wave inherited defaults should stay understandable:

- service/equipment summary defaults
- specs defaults
- primary media defaults
- proof candidate sets

Page-owned from day one:

- final H1
- hero offer
- geo wording
- CTA wording
- section order
- final SEO

## 8. Typed Sections Model

Exact mandatory sections:

### `service_landing`

- `hero_offer`
- `service_scope`
- `geo_coverage`
- `proof_cases`
- `cta`

### `equipment_landing`

- `hero_offer`
- `equipment_summary`
- `equipment_specs`
- `geo_coverage`
- `proof_cases`
- `cta`

### `about`

- `hero_offer`
- `rich_intro`
- `cta` or `contact`

### `contacts`

- `hero_offer`
- `contact`
- `geo_coverage`

This section model is the main antidote against turning the editor into a flat mega-form.

## 9. Create Flow Model

First-wave create modes:

- `Standalone`
- `From service`
- `From equipment`
- `Clone/adapt`

The create flow must stay short and useful:

- ask for minimum inputs only
- attach primary source immediately when required
- prefill a page-type scaffold
- land directly inside the page workspace

Geo enters as page-level targeting fields, not as a separate page type.

## 10. Preview/Public Shell Baseline

The minimum trusted preview baseline is:

- header
- body
- footer
- same shell direction as public rendering
- desktop and mobile states

Wave 1 does not need a rich preview diagnostics console. It only needs a trustworthy page preview plus compact readiness hints.

## 11. One-Editor Guardrails

This wave must actively prevent hidden second-editor drift.

Guardrails:

- page composition remains page-owned
- service landing legacy tooling must be helper-only or legacy-only
- no second top-level navigation entry
- no publish path outside page lifecycle
- public shell stays read-side only

## 12. Russian GUI Naming Baseline

First-layer UI should prefer Russian labels such as:

- `Рабочий экран`
- `Тип страницы`
- `Страница услуги`
- `Страница техники`
- `Источник`
- `Из услуги`
- `Из техники`
- `Без привязки`
- `Копировать и адаптировать`
- `Предпросмотр`
- `Готовность`
- `Из источника`
- `Изменено вручную`
- `Источник изменился`
- `Первый экран`
- `Что входит в услугу`
- `О технике`
- `Характеристики техники`
- `Кейсы`
- `Где работаем`

This should be treated as part of the execution scope, not as polish.

## 13. Rollout Steps

Recommended order:

1. lock one-editor guardrails
2. extend page types
3. add `equipment`
4. add typed sections
5. refactor create/start flow
6. add shell preview baseline
7. add compact readiness baseline

This order minimizes rework and keeps the wave grounded.

## 14. Risks

Top risks:

1. page model becomes a flat mega-form
2. `equipment` is introduced too weakly
3. legacy service landing tooling survives as a shadow editor
4. preview remains body-first and untrustworthy
5. Russian operator-friendly naming is skipped during implementation

## 15. What Stays Out of Scope

Later waves should own:

- full `outdated` UX
- field-level inheritance inspector
- duplicate guardrails across many pages
- adaptation wizard
- geo as separate type
- AI-led generation workflow

## 16. Recommended Next Implementation Epic

Recommended next implementation epic:

`Unified multi-type page workspace foundation`

The epic should deliver:

- the four first-wave page types
- baseline `equipment`
- first-wave typed sections
- controlled create modes
- shell-faithful preview
- one-editor guardrails

That is the minimum safe foundation for later autonomous execution.
