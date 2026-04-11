# PLAN.PAGE_WORKSPACE_REMEDIATION_REFACTOR.V1.report

Дата: 2026-04-11  
Тип: remediation/refactor planning report  
Статус: complete

## 1. Executive Summary

Текущая single-workflow model для домена `Страницы` должна быть сохранена. Полный аудит page workspace показал не архитектурный провал, а набор конкретных operational quality gaps поверх уже правильной основы.

Главный следующий шаг - локально починить открытие страниц без revision, потому что это единственный confirmed blocker. После этого remediation work естественно раскладывается на bounded волны: content integrity, operator lifecycle management, source picker clarity, AI clarity и low-risk workspace polish.

Рекомендуемая стратегия: не трогать базовую screen model, а пройти короткими PR-волнами от blocker fix к calmer daily operator experience.

## 2. Sources Used

Использованы следующие source docs:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_SINGLE_WORKFLOW_EPIC.V1.report.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_FOLLOWUP_CLEANUP_AND_POLISH.V1.report.md`
- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`

### Path discrepancy note

В prompt был указан путь `docs/reports/2026-04-10/AUDIT.PAGE_WORKSPACE.FULL.V1.md`, но фактический audit report в репозитории лежит по пути `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`. Для планирования использован именно фактический файл.

Дополнительно для seam verification были просмотрены текущие implementation zones:

- `components/admin/PageWorkspaceScreen.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`
- `components/admin/PageMetadataModal.js`
- `components/admin/PreviewViewport.js`
- `lib/admin/page-workspace.js`
- `lib/admin/entity-ui.js`
- `lib/content-core/pure.js`
- `lib/content-core/schemas.js`
- `tests/page-workspace.route.test.js`

## 3. Why current model should be preserved

Судя по аудиту, у продукта уже есть правильная структурная база:
- реестр `Страницы` работает как единый first-entry;
- unified page workspace уже usable на страницах с revision;
- metadata layer и theme control в first slice признаны достаточными;
- preview строится на canonical renderer;
- AI уже bounded и не стал вторым owner flow.

Поэтому remediation не должен переоткрывать архитектуру. Основные проблемы сейчас лежат в качестве открытия edge-case страниц, читаемости default content, lifecycle discoverability и calmer operator UX.

## 4. Key Findings Requiring Remediation

### Functional blocker

1. Страницы со статусом `Нет версии` открываются в `500` вместо safe empty workspace state.

### High-priority operator issues

2. Default CTA copy и related default text приходят в mojibake.
3. В registry/workspace нет явного bounded delete/archive path.
4. AI action wording и active-target semantics недостаточно ясны для оператора.

### Medium-priority UX issues

5. Empty states в pickers `Услуги` / `Кейсы` не объясняют next step.
6. Tablet preview почти не добавляет signal относительно desktop.
7. Header workspace перегружен объяснительным системным текстом.
8. AI panel даёт слабый progress/result feedback.

## 5. Proposed Phases

### Phase A — P0 blocker fix

Цель: убрать `500` для страниц без revision и дать honest empty workspace state без скрытого auto-create поведения.

Почему сейчас: это единственный confirmed blocker, который ломает сам базовый promise registry-first workflow.

### Phase B — Content/encoding integrity

Цель: убрать mojibake из source default literals и остановить генерацию битого default copy.

Почему сейчас: дефект явно виден в preview/review и быстро бьёт по доверию к инструменту.

### Phase C — Operator lifecycle management

Цель: добавить bounded archive/delete management path.

Почему не в самой первой волне: здесь нужен policy-level decision, чтобы не повредить review/history semantics.

### Phase D — Source picker operator clarity

Цель: сделать empty pickers понятными и actionable without product drift.

Почему отдельно: локальный UX-fix с низким риском, удобный для самостоятельного PR.

### Phase E — AI interaction clarity

Цель: убрать surprising semantics между action label, active target и returned patch, плюс добавить нормальный progress/result feedback.

Почему отдельно: это не проблема архитектуры AI, а проблема операторского доверия и predictability.

### Phase F — Workspace UX polish

Цель: снять ежедневное трение через более спокойную шапку и практичный tablet preview.

Почему последней волной: эти правки дают value, но не должны конкурировать с blocker fix и lifecycle decisions.

## 6. Decision Recommendations

### Decision 1 — What should happen for pages without revision?

Рекомендация: открывать их в honest empty safe shell, а не auto-create first draft on open.

Почему: это сохраняет explicit save semantics и не тащит скрытый create-flow внутрь открытия страницы.

### Decision 2 — Delete vs archive vs both?

Рекомендация: first operator slice строить вокруг archive/deactivate semantics. Hard delete допустим только если в кодовой базе уже существует bounded safe contract для draft-only removal и он не конфликтует с review/history.

Почему: это минимизирует риск разрушения canonical lifecycle invariants.

### Decision 3 — How to fix mojibake?

Рекомендация: править origin of defaults, а не preview symptom. Historical backfill при необходимости вынести отдельным bounded follow-up.

Почему: иначе новые страницы продолжат наследовать битые строки.

### Decision 4 — What exactly to change in AI UX?

Рекомендация: менять и label semantics, и active-target visibility, и in-flight/result feedback. Одного переименования кнопок недостаточно.

Почему: surprise рождается из комбинации неочевидного target state и слабого feedback loop.

### Decision 5 — How far should tablet preview changes go?

Рекомендация: ограничиться width presets and labels, без расширения preview architecture.

Почему: practical parity можно улучшить локально, без нового redesign.

### Decision 6 — What to do with the workspace header?

Рекомендация: сократить и/или свернуть объяснительный текст, оставив только high-signal operational guidance.

Почему: это снимет ежедневный cognitive load без потери ориентира.

## 7. Risks

| Risk | Why it matters | Mitigation |
| --- | --- | --- |
| No-revision fix accidentally creates content on open | Вернёт скрытый draft narrative и испортит ownership clarity | Keep open path non-mutating; first draft only on explicit save |
| Lifecycle actions collide with review/history | Может поломать канон downstream operations | Separate policy decision, archive-first posture, explicit guards |
| Mojibake fix is too shallow | Симптом исчезнет не везде, source corruption останется | Fix source literals and add downstream smoke verification |
| AI clarity fix increases AI prominence too much | AI может стать псевдо-редактором в восприятии | Keep manual edit primary, AI secondary and bounded |
| Empty-state polish drifts into source-management product | Scope разрастётся beyond bounded remediation | Limit to explanation + next step, no embedded management UI |
| Header/preview polish expands into redesign | Потеряется boundedness эпика | Keep low-risk local polish only |

## 8. Suggested Next Implementation Epic

Следующий implementation epic должен брать **Phase A** как обязательный blocker fix и по возможности объединять его с **Phase B**, если команда уверена, что source-default fix локален и не несёт unexpected migration risk.

Если нужен самый безопасный порядок:
1. Phase A
2. Phase B
3. Phase D + Phase E
4. Phase C
5. Phase F

Если нужен самый быстрый operator-value пакет без лишнего риска:
- PR 1: Phase A
- PR 2: Phase B
- PR 3: Phase D + Phase E
- PR 4: Phase C
- PR 5: Phase F

## 9. Suggested Verification Strategy After Fixes

### After Phase A

- Open 10-15 pages across statuses: `Нет версии`, draft-only, review-submitted, published.
- Confirm no `500` on no-revision pages.
- Confirm empty workspace state is intelligible and non-mutating until explicit save.

### After Phase B

- Create or scaffold a fresh page and verify default CTA/default copy in workspace preview.
- Verify same copy on review page.
- Spot-check existing unaffected pages for regression.

### After Phase C

- Verify archive/delete discoverability from intended entry points.
- Verify review/history invariants still hold.
- Verify registry filters and page visibility remain understandable.

### After Phase D

- Check empty `Услуги` / `Кейсы` modals with operator eyes.
- Ensure launcher model remains compact and bounded.

### After Phase E

- Run manual AI smoke with different selected targets.
- Verify action wording, target clarity, progress feedback, and returned patch clarity.
- Confirm AI still requires explicit apply and save.

### After Phase F

- Check that header is calmer but still orienting.
- Verify tablet preview is materially distinct from desktop while using same renderer.

## 10. Final planning takeaway

Page workspace не требует новой архитектуры. Он требует аккуратной remediation wave над уже правильной single-workflow model. Самый важный сигнал из аудита: чинить нужно не всё подряд, а в строгом порядке - сначала availability and integrity, потом operator lifecycle and clarity, потом calmer polish.
