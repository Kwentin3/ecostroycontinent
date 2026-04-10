# LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1

Статус: refactored to page-domain-first execution posture
Дата: 2026-04-10
Legacy filename note: retained for continuity; this document no longer recommends a separate top-level landing workspace surface.

## 1. Objective

Перевести старую embedded-AI reality в модель одного домена `Страницы`, не ломая backend, publish semantics или canonical `Page` ownership.

## 2. Execution posture

What stays true:
- `Page` is the owner of standalone page truth and page-level composition.
- review/publish remain explicit and reused.
- AI remains assistive only.

What changes in the docs posture:
- no separate first-layer `AI-верстка` domain;
- no separate chooser as the primary way into page work;
- no second editor-like narrative next to `Страницы`.

## 3. MVP target slice

The first slice should read as:
- one pages registry screen;
- one main page workspace;
- one metadata layer;
- one embedded AI panel inside the page workspace.

## 4. Entry rule

User enters page work through `Страницы`.

Possible implementation detail may still use nested routing, but documentation posture is fixed:
- entry belongs to the pages domain;
- AI assistance is entered from within the page workflow;
- the user should not perceive a second top-level workflow.

## 5. Workspace composition rule

- center = page canvas / story rail;
- left = compact source launchers;
- right = pinned AI assistant;
- metadata = separate movable tabbed modal.

## 6. Ownership rule

- composition stays page-owned;
- connective copy stays page-owned;
- source pickers help selection, but do not become new owners;
- AI suggestions remain suggestions until accepted into page truth.

## 7. What implementation must avoid

- sidebar-first AI screen narrative;
- dedicated chooser as user-facing mandatory first step;
- long left warehouse of cards;
- engineer-console first layer;
- metadata clutter in the main center;
- any separate AI-owned truth model.

## 8. Practical phase order

1. Lock docs and screen model around `Страницы`.
2. Define minimal page card and registry behavior.
3. Define main page workspace behavior.
4. Define source launcher + specialized modal pattern.
5. Define metadata layer posture.
6. Keep existing review/publish path unchanged.
