# LANDING_COMPOSITION_IMPLEMENTATION_PLAN_v1

Статус: refactored to single-page-workflow model
Дата: 2026-04-10

## Purpose

Этот план переводит composition work из старой landing-workspace narrative в единый домен `Страницы`.

Главная идея:
- `Page` остаётся canonical owner standalone page truth;
- composition work происходит в главном page workspace;
- AI встроен как assistive panel, а не как отдельный primary surface.

## Objective

Implementation direction для docs:
- один реестр `Страницы` как верхний уровень работы;
- один главный экран страницы как место composition work;
- metadata as separate management layer;
- source picking through compact launchers and specialized modal galleries;
- review/publish remain explicit and reused.

## Workstreams

| Workstream | Owns | Does not own |
| --- | --- | --- |
| Pages registry UX | cards/list toggle, search, filters, minimal page card, entry into work | second AI domain |
| Main page workspace | center canvas, left source launchers, right AI panel | separate top-level AI screen |
| Metadata layer | tabbed, movable modal for rare/management fields | replacing the main page workflow |
| Composition contract integration | page-owned composition, proof refs, connective-copy posture | page-builder freedom |
| Review/publish handoff | reuse explicit downstream workflow | new publish model |

## Ordered phases

### Phase 0 - lock the model

- Confirm one user domain: `Страницы`.
- Remove the separate top-level AI surface posture from planning docs.
- Lock `Page` as owner of composition and connective copy.

### Phase 1 - registry screen

- Define `Страницы` registry as the first-layer overview.
- Default view = cards.
- Secondary view = list.
- Search and filters are first-layer tools.
- Page card stays minimal.

### Phase 2 - main page workspace

- Center = page canvas / story rail.
- Left = compact source launchers.
- Right = pinned AI panel.
- Do not surface long source lists directly on the left rail.

### Phase 3 - source access model

- `Медиа`, `Кейсы`, `Услуги` open through specialized selection modals.
- Keep source access lightweight.
- Avoid warehouse-like endless rail behavior.

### Phase 4 - metadata separation

- Move route/SEO/service fields that are rare or managerial into metadata modal.
- Keep frequent composition work in the main workspace.
- Use tabs and movable behavior for metadata management.

### Phase 5 - composition ownership alignment

- Keep connective copy inside page workflow.
- Keep AI assistive only.
- Keep review/publish unchanged.

## Deferred / not in this pass

- generic page builder behavior;
- separate AI product surface;
- broad route-family expansion;
- runtime, API, DB or publish redesign;
- surfacing technical diagnostics in the first UX layer.

## Success condition for documentation and implementation follow-up

После выравнивания docs implementation teams should read one consistent model:
- user enters through `Страницы`;
- user works inside one main page workspace;
- AI is embedded, assistive, and subordinate;
- metadata are a separate management layer;
- page owns composition and bridges;
- review/publish stay explicit.
