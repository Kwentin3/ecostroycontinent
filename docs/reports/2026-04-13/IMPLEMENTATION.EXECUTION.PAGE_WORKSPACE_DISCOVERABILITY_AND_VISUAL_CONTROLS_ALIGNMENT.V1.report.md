# IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_DISCOVERABILITY_AND_VISUAL_CONTROLS_ALIGNMENT.V1

## 1. Executive Summary

Выполнена bounded wave по выравниванию `claimed-vs-implemented` для `page workspace`.

Что реально доведено:

- ослаблены и уточнены старые формулировки в docs, где partial/later-wave вещи читались как fully visible operator features;
- добавлена явная discoverability-подсказка, что визуальные настройки страницы живут в `Метаданных` → `Основное`;
- русифицированы названия тем страницы в operator-facing UI;
- улучшены helper/empty-state тексты в source panel для более понятного следующего шага;
- подтверждён и закрыт bounded interaction issue вокруг закрытия metadata modal по `Escape`.

Что принципиально не делалось:

- redesign рабочего экрана;
- перенос метаданных в first layer;
- новый visual-settings subsystem;
- broad rewrite документации;
- усиление AI copy до обещаний большего UI, чем реально доступно сейчас.

Итог: claimed-vs-implemented картина стала заметно чище. Оператор теперь может найти визуальные настройки без археологии, видит русские названия тем и получает более внятные next-step подсказки в зонах источников.

## 2. Source Docs Used

Основные документы:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/product-ux/DECISION.UNIFIED_PAGE_WORKSPACE_MULTITYPE_OWNER_MODEL.v1.md`
- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-13/AUDIT.CLAIMED_VS_IMPLEMENTED.PAGE_WORKSPACE_UI_FEATURES.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.UI_QUESTION_MODEL_HINTS.V1.report.md`
- свежие implementation/execution reports вокруг foundation/remediation/layout fix

Фактические UI/code zones:

- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageWorkspaceScreen.module.css`
- `components/admin/PageMetadataModal.js`
- `lib/admin/page-workspace-copy.js`
- `lib/landing-composition/visual-semantics.js`
- `tests/admin/page-workspace-discoverability.test.js`

Discrepancy note:

- `latest execution reports` резолвились в актуальные артефакты от `2026-04-13`, а не в один отдельный индексный файл. Для закрытия wave использовались best available latest reports.

## 3. Claimed-vs-Implemented Misalignments Found

Основные misalignment points, которые закрывались этой wave:

1. Visual controls существовали, но оператор не видел, где именно их искать.
2. Theme names оставались англоязычными в operator-facing UI.
3. Source panel empty states слабо подсказывали следующий шаг.
4. Часть старых docs/reports описывала AI/visual/source affordances чуть сильнее, чем они выглядят в текущем live UI.
5. Metadata modal после предыдущих проходов уже работала лучше, но нужно было честно перепроверить interaction reliability, а не считать проблему закрытой на словах.

## 4. Docs/Wording Changes Applied

Bounded wording alignment внесён там, где old wording переобещал текущий UI:

- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
  - AI layer ослаблен до assistive/conditional surface, а не до guaranteed visible panel на каждом экране.
  - правый rail описан честно как `предпросмотр / готовность`, без обещания richer side systems по умолчанию.

- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
  - добавлен historical-alignment контекст, чтобы старые наблюдения не читались как точное описание текущего unified workspace.
  - wording вокруг theme/header semantics ослаблен до контекста той audited generation.

- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`
  - AI patch flow и source-picker wording уточнены как относящиеся к той remediation generation, а не как guaranteed current live operator surface.

Эта wave не переписывала документы целиком. Поправлены только конфликтующие и misleadingly strong места.

## 5. Discoverability Changes Applied

### 5.1 Visual controls cue

В `page workspace` добавлена короткая и спокойная подсказка:

`Внешний вид страницы настраивается в «Метаданных» → «Основное».`

Это решает главный текущий operator pain:

- feature существует;
- surface не меняется;
- metadata остаются second-layer management surface;
- но оператор теперь получает прямую навигационную подсказку в правильном месте.

### 5.2 Metadata theme hint

Внутри metadata modal рядом с полем темы добавлена уточняющая подсказка:

`Тема меняет общий тон страницы и отражается в предпросмотре.`

Это помогает связать control с результатом и снижает эффект “я нашёл поле, но не понимаю его влияние”.

## 6. Visual Naming / Russian Label Changes Applied

Russification выполнена для operator-facing theme labels:

| Internal key | Previous operator label | New operator label |
| --- | --- | --- |
| `earth_sand` | `Earth Sand` | `Песочный тон` |
| `forest_contrast` | `Forest Contrast` | `Лесной контраст` |
| `slate_editorial` | `Slate Editorial` | `Сланцевый тон` |

Что важно:

- internal keys не ломались;
- changed only operator-facing labels;
- naming остался коротким и спокойным;
- лишние англицизмы убраны.

## 7. Source Panel / Empty-State Copy Changes Applied

Source panel получил более явные next-step hints без превращения в мини-руководство.

Улучшены состояния для:

- основной услуги;
- основной техники;
- главного медиа;
- кейсов;
- галерей.

Новая логика copy:

- коротко объяснить, чего сейчас не хватает;
- подсказать следующий шаг;
- по возможности дать прямой переход в соответствующий реестр.

Практический эффект:

- operator не остаётся в состоянии “пусто и непонятно”;
- особенно для `service_landing` и `equipment_landing` source model становится понятнее без отдельного redesign.

## 8. Metadata Modal Interaction Findings And Fix Status

### 8.1 Что подтвердилось

В pre-fix smoke подтверждалось, что закрытие по `Escape` ощущалось ненадёжным. В этой wave закреплён bounded fix:

- фокус переводится в dialog при открытии;
- `Escape` ловится стабильно и закрывает modal, если нет `busy`-state;
- post-fix live smoke подтвердил стабильное закрытие по `Escape`.

### 8.2 Что отдельно перепроверено

Отдельно была проверена гипотеза про `overlay`/outside click:

- реальный пользовательский сценарий “кликнуть мимо модалки” на live contour закрывает окно корректно;
- неудачный сценарий был воспроизведён только как прямой forced click по самому overlay-элементу в automation flow;
- этот путь признан non-representative и не классифицирован как отдельный живой product bug.

Итог:

- `Escape` issue: подтверждён и закрыт.
- outside click issue: как operator-facing баг не подтверждён.

## 9. Files / Code Zones Changed

Code:

- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageWorkspaceScreen.module.css`
- `components/admin/PageMetadataModal.js`
- `lib/admin/page-workspace-copy.js`
- `lib/landing-composition/visual-semantics.js`
- `tests/admin/page-workspace-discoverability.test.js`

Docs:

- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.CLAIMED_VS_IMPLEMENTED.PAGE_WORKSPACE_UI_FEATURES.V1.report.md`
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_DISCOVERABILITY_AND_VISUAL_CONTROLS_ALIGNMENT.V1.report.md`

## 10. Tests / Checks Run

Local / CI:

- `node --test tests/admin/page-workspace-discoverability.test.js tests/admin/question-model-hints.test.js tests/admin/page-workspace-layout-guardrails.test.js`
- `npm test`
- `npm run build`

Result:

- targeted tests: passed
- full test suite: passed
- build: passed
- non-blocking warning remained around existing `next.config.mjs` NFT trace; not introduced by this wave

## 11. Post-Deploy Smoke Results

### 11.1 Delivery baseline

Primary runtime/UI commit:

- `592d998` — `feat: improve page workspace discoverability`

Build/publish:

- GitHub build run succeeded
- image digest used for delivery:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:b9f3c56dc3212214f19661f6c0a2a2a6574fb44018d4cc9ebbe307b2cd267526`

Deploy:

- canonical deploy workflow failed on host env permissions (`/opt/ecostroycontinent/runtime/.env: permission denied`)
- manual SSH delivery was completed through the canonical VM path

### 11.2 Health

- `GET https://ecostroycontinent.ru/api/health` -> `200`
- response: `{"status":"ok","service":"next-app","nodeEnv":"production","databaseConfigured":true}`

### 11.3 Operator smoke

Authenticated live smoke used:

- login: `superadmin`
- representative pages:
  - `equipment_landing` — `/admin/entities/page/entity_dd7222fd-c8cc-43e7-a559-543118ef2eb2`
  - `service_landing` — `/admin/entities/page/entity_cbc06af9-f492-4c2e-a772-371f444cce58`

Verified on live contour:

- page workspace opens successfully after login
- visual-settings hint is visible in workspace
- preview hint is visible
- metadata modal opens reliably
- theme labels are Russian:
  - `Песочный тон`
  - `Лесной контраст`
  - `Сланцевый тон`
- clearer source empty states are visible
- `Escape` closes metadata modal reliably
- click outside the modal closes it in the normal operator scenario
- no obvious regression found in review handoff visibility or page editing baseline

## 12. What Was Intentionally Not Changed

Out of scope by design:

- moving theme controls into the first layer
- redesign of source panel
- richer visual-settings subsystem
- new AI panel or stronger AI affordance
- broader metadata information architecture changes
- large copy rewrite across the whole admin UI

## 13. Remaining Open Questions

1. Стоит ли later wave вынести короткий visual-settings cue ещё и в registry/create flow, или это уже будет лишний шум?
2. Нужен ли bounded pass по русификации secondary visual copy вне page workspace?
3. Нужно ли отдельно нормализовать operator wording вокруг partial AI seams, чтобы ожидания в смежных экранах тоже не были завышены?

## 14. Recommended Next Step

Следующий разумный bounded шаг:

`PAGE_WORKSPACE_METADATA_AND_DISCOVERABILITY_POLISH_WAVE`

Фокус:

- добрать ещё 1-2 точечных discoverability cues в наиболее частых operator тупиках;
- не расширять surface архитектурно;
- продолжить разграничение `implemented and visible` vs `implemented but secondary` в документации и UI copy.
