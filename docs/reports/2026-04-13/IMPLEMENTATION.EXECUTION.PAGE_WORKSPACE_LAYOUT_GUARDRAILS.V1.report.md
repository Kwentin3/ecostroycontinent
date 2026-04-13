# IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_GUARDRAILS.V1

## 1. Executive Summary

Для unified page workspace реализована маленькая bounded guardrail-wave против повторного возврата layout/overflow regressions. Я не открывал новый рефакторинг, не менял архитектуру editor surface и не строил тяжёлую визуальную регрессионную платформу. Вместо этого был добавлен компактный набор защит:

- code-level sticky note на layout contract
- явные `data-layout-zone` маркеры для трёх рабочих зон
- узкий automated contract-test, который следит за шириной source column, shared input/select contract и breakpoint logic
- post-deploy geometric smoke на representative `service_landing` и `equipment_landing`

Wave доведена до `main`, собрана, доставлена на сервер и проверена на живом контуре.

## 2. Source Docs Used

- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/product-ux/DECISION.UNIFIED_PAGE_WORKSPACE_MULTITYPE_OWNER_MODEL.v1.md`
- `docs/implementation/PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.v1.md`
- `docs/implementation/PLAN.EXECUTION_READY.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1.md`
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_OVERFLOW_FIX.V1.report.md`

Фактические code zones:

- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageWorkspaceScreen.module.css`
- `components/admin/PreviewViewport.js`
- `components/admin/admin-ui.module.css`

Discrepancies:

- `docs/reports/<latest>/...` был разрешён в актуальный отчёт от `2026-04-13`
- path mismatches, мешающих работе, не было

## 3. Chosen Guardrail Mechanism

Выбран комбинированный, но bounded механизм:

1. lightweight contract-test по CSS и component source
2. минимальные DOM hooks для smoke:
   - `data-layout-zone="sources"`
   - `data-layout-zone="canvas"`
   - `data-layout-zone="preview"`
3. live Playwright smoke с проверкой геометрии зон на нескольких ширинах

Почему именно так:

- regression уже была layout-level и не ловилась unit/build alone
- для этого класса багов нужен хотя бы один сигнал на уровень выше чистой бизнес-логики
- при этом тяжёлый screenshot suite на весь проект был бы несоразмерен задаче

Этот механизм достаточно полезный, потому что ловит именно возврат известных contract regressions:

- слишком узкая source column
- выпадение `select`/`input` из bounded contract
- исчезновение трёхзонной структуры на wide desktop
- слишком поздний перенос preview
- сломанный fallback на intermediate и narrow widths

## 4. What Was Implemented

### 4.1. Sticky guard note in CSS

В `PageWorkspaceScreen.module.css` добавлен короткий contract note:

- левая колонка явно зафиксирована как full source/operator zone
- отдельно проговорено, что это больше не micro-rail

Это не декоративный комментарий, а sticky reminder для будущих правок layout contract.

### 4.2. Layout zone markers

В `PageWorkspaceScreen.js` добавлены:

- `data-layout-zone="sources"` на source column
- `data-layout-zone="canvas"` на central canvas
- `data-layout-zone="preview"` на preview/readiness column

Зачем:

- упрощают live smoke и bounded DOM-level verification
- не меняют product behavior
- не создают новый subsystem

### 4.3. Automated contract test

Добавлен:

- `tests/admin/page-workspace-layout-guardrails.test.js`

Что тест фиксирует:

1. wide desktop contract:
   - source column остаётся `minmax(280px, 320px)`
   - canvas и preview остаются отдельными bounded zones
   - `.shell > *` сохраняет safe shrink contract
   - `.input`, `.select`, `.textarea` разделяют один bounded width contract

2. intermediate and narrow breakpoints:
   - при `max-width: 1480px` preview обязан уходить вниз
   - при `max-width: 860px` shell обязан переходить в single-column state

3. representative source states:
   - в том же editor surface присутствуют branches для `service_landing` и `equipment_landing`
   - сохраняется source/canvas/preview order в компоненте

## 5. Representative States Covered

### Автоматикой покрыто

- wide desktop layout contract
- intermediate breakpoint contract
- narrow fallback contract
- representative `service_landing` source state
- representative `equipment_landing` source state
- presence and order of the three layout zones

### Live smoke покрыто

Representative pages:

- `service_landing`:
  - `/admin/entities/page/entity_cbc06af9-f492-4c2e-a772-371f444cce58`
- `equipment_landing`:
  - `/admin/entities/page/entity_dd7222fd-c8cc-43e7-a559-543118ef2eb2`

Widths checked:

- wide desktop: `1600px`
- intermediate desktop/laptop: `1360px`
- narrow fallback: `820px`

Geometry results:

For `service_landing`:

- `1600px`: three-zone horizontal order kept, no overlap
- `1360px`: source and canvas stay on the top row, preview moves below, no overlap
- `820px`: all three zones stack vertically in one column

For `equipment_landing`:

- `1600px`: three-zone horizontal order kept, no overlap
- `1360px`: source and canvas stay on the top row, preview moves below, no overlap
- `820px`: all three zones stack vertically in one column

### Manual-only remainder

- extremely content-heavy outlier states with much longer labels/cards than current smoke fixtures
- rare browser-engine differences outside the verified live contour

## 6. Files / Code Zones Changed

- [PageWorkspaceScreen.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/PageWorkspaceScreen.js)
- [PageWorkspaceScreen.module.css](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/PageWorkspaceScreen.module.css)
- [page-workspace-layout-guardrails.test.js](/d:/Users/Roman/Desktop/Проекты/сайт%20Армен/tests/admin/page-workspace-layout-guardrails.test.js)

## 7. Tests / Checks Run

Targeted:

- `node --experimental-specifier-resolution=node --test tests/admin/page-workspace-layout-guardrails.test.js`

Full checks:

- `npm test`
- `npm run build`

Result:

- all tests passed
- build passed
- existing Turbopack/NFT warning around `next.config.mjs` / `lib/config.js` / `app/api/media/[entityId]/route.js` remains unchanged and unrelated to this wave

## 8. Post-Deploy Smoke Results

Delivery:

- commit: `e8651e1` — `Add page workspace layout guardrails`
- push to `origin/main`: completed
- GitHub `build-and-publish` run `24343026694`: `success`
- deployed image digest:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:cc1881672c663046ba11989ded116587dad352a00a69d0146c2f53c130c799a5`

Server deploy:

- repo updated on VM
- runtime `APP_IMAGE` pin updated
- `docker compose up -d --force-recreate --remove-orphans app`

Health:

- `https://ecostroycontinent.ru/api/health` returned `ok`

Live UI conclusions:

- page workspace opens normally after deploy
- source column remains usable and readable
- canvas does not overlap source column
- preview relocates correctly on constrained widths
- same behavior confirmed on representative service and equipment pages

## 9. What This Guardrail Protects Against

This wave protects against the return of:

1. source column silently shrinking back toward a micro-rail
2. select/input elements losing the shared bounded width contract
3. canvas visually starting on top of the source column
4. preview remaining on the first row too long at laptop/intermediate widths
5. loss of the intended three-zone order in component structure

It does not try to guarantee pixel-perfect rendering across every future content permutation. It intentionally protects the known high-risk contract seams.

## 10. What Remains Out of Scope

- full visual regression platform
- screenshot snapshots for the entire admin UI
- redesign of page workspace
- broader CSS cleanup beyond the guardrail need
- advanced responsive verification for every admin screen
- auto-detection of every possible long-content layout edge case

These were deliberately excluded to keep the epic compact and maintainable.

## 11. Recommended Next Step

Следующий разумный шаг не новый layout refactor, а very small extension of the same protection model:

- если source column получит новые dense control groups во второй волне, добавить ещё один bounded representative test fixture на content-heavy state
- при появлении explicit inherited/drift badges в source zone переоценить only that column’s density and fallback

Иначе говоря: не расширять guardrail-платформу заранее, а доращивать её только вместе с реальным ростом operator surface complexity.
