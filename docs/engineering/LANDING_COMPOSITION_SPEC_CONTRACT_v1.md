# LANDING_COMPOSITION_SPEC_CONTRACT_v1

Статус: refactored for single-page-workflow model
Дата: 2026-04-10

## Purpose

Этот контракт описывает backstage composition shape, с которым работает главный экран страницы внутри домена `Страницы`.

Документ больше не описывает отдельный пользовательский surface `AI-верстка`. Он фиксирует contract layer, который стоит за page workspace, где:
- canonical owner остаётся у `Page`;
- AI остаётся assistive only;
- composition и connective copy остаются page-owned.

## Scope boundary

| Owns | Does not own | Assumes | Forbids |
| --- | --- | --- | --- |
| Page-scoped composition structure, ordered proof refs, bounded visual-semantic intent, page-owned connective copy semantics, and projection into canonical `Page` truth. | Top-level product navigation, metadata modal UX details, generic page-builder semantics, route truth outside canonical `Page`. | Content Core stays source of truth; `Page` remains durable owner of standalone page composition; AI may assist but does not own truth. | New truth stores, AI-owned truth, freeform HTML/JSX, detached reusable connective-copy entity by default, hidden publish semantics. |

## Relationship to page truth

`LandingDraft` or any similar composition artifact is an internal working representation behind the page workspace.

It is not:
- a second source of truth;
- a separate published artifact owner;
- a reason to create a second page editor.

All publishable composition work must resolve into exactly one canonical `Page` owner.

## Contract posture for connective copy

Страница владеет:
- переходами между блоками;
- связочным текстом;
- page-level composition logic.

Следовательно:
- connective copy belongs to the page workflow;
- it must not be modeled as an external reusable entity by default;
- AI suggestions for bridge text are suggestions only until accepted into page-owned composition truth.

## Contract shape

### Required composition frame

| Field | Status | Notes |
| --- | --- | --- |
| `pageId` | Required | Canonical `Page` owner. |
| `candidateId` | Required | Stable id for the current composition candidate or draft view. |
| `compositionFamily` | Required | Fixed bounded family for this composition model. |
| `sourceContextSummary` | Required | Compact summary of source materials and current goal. |
| `pageThemeKey` | Required | Approved theme intent; token-backed, not raw styling. |
| `hero` | Required | Opening page block. |
| `serviceCardIds` | Allowed | Ordered refs to existing `Service` entities. |
| `caseCardIds` | Allowed | Ordered refs to existing `Case` entities. |
| `mediaAssetIds` | Allowed | Ordered refs to existing `MediaAsset` entities. |
| `ctaVariant` | Required | CTA posture used by the page. |
| `seo` | Allowed | Canonical SEO data that still belongs to `Page`. |

### Connective-copy rule

Контракт допускает page-scoped connective copy only as part of bounded page composition.

Это означает:
- bridge text может жить внутри approved page composition fields;
- bridge text не создаёт новую reusable content entity сам по себе;
- bridge text не должен требовать отдельного owner outside `Page`.

Документ намеренно не открывает generic “bridge slot between any two arbitrary blocks” semantics без отдельного согласования. Здесь фиксируется ownership posture, а не безграничное расширение схемы.

## Allowed references

- `serviceCardIds` -> `Service`
- `caseCardIds` -> `Case`
- `mediaAssetIds` -> `MediaAsset`
- fixed shell references -> published shell truth where applicable
- `pageThemeKey` -> approved theme/token registry entry

## Ordering semantics

Порядок source refs является частью page composition truth.

Rules:
- order is meaningful;
- preview and final render must preserve approved order;
- UI may help reorder within bounded rules;
- no extra hidden ordering layer should appear outside the page-owned composition contract.

## Metadata boundary

Route / slug / SEO / publish-adjacent fields остаются page-owned, но в UX-модели уходят в отдельный metadata layer.

Это UX boundary, а не новый truth boundary.

Контракт не создаёт отдельного metadata owner и не меняет канон `Page` as owner.

## AI boundary

AI may:
- suggest composition adjustments;
- suggest connective copy;
- suggest wording improvements.

AI may not:
- become a second source of truth;
- own the composition contract;
- bypass review/publish discipline;
- create a second user-facing owner workflow.

## Explicit exclusions

- отдельный top-level AI surface как owner contract;
- detached reusable bridge-text library by default;
- generic page-builder freedom;
- raw styling payloads;
- arbitrary free canvas semantics;
- AI-owned published truth.
