# UI Russification Audit v1

## 1. Audit Scope

- Scope: admin/internal operator UI only.
- This pass is code-verified only. I was not able to re-open the authenticated live admin browser session in this turn because the Playwright backend was closed, so runtime copy is not separately verified here.
- I checked the admin shell, landing workspace, source editor, review pages, verification panels, Memory Card panels, media workspace, diagnostics, and the shared UI copy helpers.
- One doc mismatch matters: the repo does not contain the exact requested `docs/product-ux/PRD_Экостройконтинент_v0.3.2.md`; the closest current PRD source is `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`.

## 2. Sources Checked

- Product docs:
  - `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
  - `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- Engineering docs:
  - `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
  - `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
  - `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
  - `docs/engineering/LANDING_FACTORY_DOMAIN_MAP_v1.md`
  - `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
  - `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`
- Runtime/audit docs:
  - `docs/reports/AI_WORKSPACE_UI_PRESENCE_AUDIT_v1.report.md`
  - `docs/reports/LANDING_FIRST_WORKSPACE_EXECUTION_v1.report.md`
  - `docs/reports/LANDING_FIRST_WORKSPACE_REALITY_AUDIT_v1.report.md`
  - `docs/reports/AI_WORKSPACE_TEST_PROGRAM_V1.report.md`
  - `docs/reports/LANDING.CONTRACT.ANAMNESIS.V1.md`
- Code surfaces inspected:
  - `components/admin/AdminShell.js`
  - `lib/admin/nav.js`
  - `app/admin/(console)/page.js`
  - `app/admin/(console)/workspace/landing/page.js`
  - `app/admin/(console)/workspace/landing/[pageId]/page.js`
  - `components/admin/LandingWorkspaceMemoryPanel.js`
  - `components/admin/LandingWorkspaceVerificationPanel.js`
  - `components/admin/ServiceLandingWorkspacePanel.js`
  - `components/admin/ServiceLandingFactoryPanel.js`
  - `components/admin/EntityEditorForm.js`
  - `components/admin/RevisionDiffPanel.js`
  - `components/admin/PreviewViewport.js`
  - `components/admin/MediaGalleryWorkspace.js`
  - `components/admin/MediaCollectionOverlay.js`
  - `components/admin/MediaImageEditorPanel.js`
  - `components/admin/LlmDiagnosticsPanel.js`
  - `app/admin/(console)/review/page.js`
  - `app/admin/(console)/review/[revisionId]/page.js`
  - `app/admin/(console)/revisions/[revisionId]/publish/page.js`
  - `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
  - `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js`
  - `app/admin/login/page.js`
  - `app/admin/bootstrap/superadmin/page.js`
  - `lib/ui-copy.js`
  - `lib/admin/screen-copy.js`
  - `lib/admin/operation-feedback.js`
  - `lib/admin/landing-workspace.js`
  - `lib/landing-workspace/landing.js`
  - `app/api/admin/workspace/landing/[pageId]/route.js`

## 3. What Is Already Acceptably Russian

- The admin shell navigation is already mostly Russian: `Главная`, `Проверка`, `Лендинги`, `Настройки`, `Медиа`, `Услуги`, `Кейсы`, `Страницы`, `Пользователи`.
- The dashboard, review queue, publish page, history page, login page, and superadmin bootstrap page are already largely Russian and readable for operators.
- The central copy helpers already hold a lot of Russian labels and helper text:
  - `lib/ui-copy.js`
  - `lib/admin/screen-copy.js`
  - `lib/admin/readiness-actionability.js`
  - `lib/admin/content-ops-cockpit-view.js`
  - `lib/admin/evidence-register-view.js`
- `LLM`, `SEO`, and `Page` are acceptable technical concepts in the code/docs, but they should not leak into user-facing labels unless they are translated or explained.

## 4. Where English / Mixed-Language UI Still Appears

### A. Navigation and Shell Copy

- The shell is mostly clean, but `LLM диагностика` is still a technical carry-over rather than plain Russian.
- This is acceptable as a technical acronym, but it should stay the exception, not the pattern.

### B. Core Operator Screens

- The landing workspace chooser is still heavily English-labeled.
- The dedicated landing workspace screen mixes Russian and English in the same visible panel set.
- The source editor still exposes a developer-facing CTA with `candidate/spec`.
- The workspace-to-review handoff still exposes `workspace`, `Page truth`, `Turn log`, and `Open review` / `Open draft review` in English.

### C. Status / System Language

- Verification summaries and status badges still surface English phrases like `Approval-eligible`, `Render compatible`, and `Publish-ready`.
- The landing workspace route returns English fallback errors such as `Landing workspace is page-only.` and `Page truth is missing.`.
- The landing verification logic still emits English summaries such as `There are blocking landing candidate issues.`.
- The diagnostics UI still shows English table headers like `HTTP status`, `Diagnostic kind`, and `Trace ID`.

### D. Mixed-Language / Awkward-Language Cases

- `Сгенерировать candidate/spec` is a direct developer-leak label.
- `Показать в превью` and `Превью` are inconsistent with `предпросмотр`.
- `Открыть landing workspace` is a mixed-language CTA in an otherwise Russian editor page.
- `media workspace`, `inspector`, `usage`, `draft asset`, `binary overwrite`, and `variant flow` appear in media surfaces and read like developer terms.
- The legacy service-prefixed panels still present English surface labels to operators.

### E. Terms That Should Stay Technical or Semi-Technical

- `LLM` can stay as an acronym.
- `SEO` can stay as an acronym when paired with Russian context.
- `Page` can stay in code/docs, but the UI should use a Russian label.
- `Memory Card` is a technical substrate term; in the UI it should be translated.
- `Trace` can stay semi-technical in diagnostics if the panel is explicitly technical.
- `Preview` is better translated to `Предпросмотр` in user-facing admin UI.

## 5. High-Severity User-Facing Language Problems

| Surface | Current text | Problem type | Recommended Russian wording | Severity | Notes |
|---|---|---|---|---|---|
| `app/admin/(console)/workspace/landing/page.js:24-92` | `Landing workspace`, `Workspace chooser`, `Landing workspace chooser`, `Choose the Page owner first`, `Resume current workspace`, `No active page anchor yet...`, `Открыть workspace` | fully English / mixed language | `Рабочая зона лендингов`, `Выбор лендинга`, `Сначала выберите владельца Page`, `Возобновить сессию`, `Привязка к странице пока не создана`, `Открыть рабочую зону` | critical confusion | This is the first visible entry point for the new workflow. It should feel Russian immediately. |
| `app/admin/(console)/workspace/landing/[pageId]/page.js:45-198` | `Page truth`, `Turn log`, `Recent turn`, `Preview`, `Intent composer`, `Bounded landing instruction`, `Change intent`, `Open source editor`, `Refresh workspace anchor`, `Open review`, `Open draft review` | mixed language / technical leakage | `Каноническая страница`, `Журнал хода`, `Последний ход`, `Предпросмотр`, `Постановка задачи`, `Короткая инструкция по лендингу`, `Что изменить`, `Открыть редактор страницы`, `Обновить привязку`, `Открыть проверку`, `Открыть проверку черновика` | critical confusion | This is the primary AI-assisted surface. Mixed language here makes the whole product feel unfinished. |
| `components/admin/LandingWorkspaceMemoryPanel.js:13-116` | `Memory Card`, `Landing workspace state`, `Session identity`, `Editorial intent`, `Proof selection`, `Artifact state`, `Trace`, `Decisions`, `Recent turn`, `Derived slice` | fully English | `Рабочая память`, `Состояние рабочей зоны лендинга`, `Сессия`, `Намерение правки`, `Выбор доказательств`, `Состояние артефакта`, `Трассировка`, `Решения`, `Журнал хода`, `Производная проекция` | high | The panel is operator-visible and currently reads like an internal engineering view. |
| `components/admin/LandingWorkspaceVerificationPanel.js:27-154` and `components/admin/ServiceLandingFactoryPanel.js:27-152` | `Landing candidate report`, `Service candidate report`, `Landing factory`, `Approval-eligible`, `Render compatible`, `Publish-ready`, `LLM path`, `Section projection`, `Verification classes`, `Blocking issues`, `No blocking issues.` | fully English / technical leakage | `Отчет по лендингу`, `Отчет по кандидату`, `Рабочая зона лендинга`, `Можно согласовать`, `Готов к рендеру`, `Готов к публикации`, `Путь LLM`, `Проекция блоков`, `Классы проверки`, `Блокирующие проблемы`, `Блокирующих проблем нет` | high | The shared verification slice is the right place to be plain Russian, because operators read it before review and publish. |
| `components/admin/EntityEditorForm.js:503-526` and `app/admin/(console)/entities/[entityType]/[entityId]/page.js:73-84` | `Сгенерировать candidate/spec`; `Открыть landing workspace` | mixed language / developer leakage | `Сгенерировать черновик` or `Сгенерировать вариант`; `Открыть рабочую зону лендинга` | high | The source editor is the canonical truth-editing surface, so the CTA language must not sound like a backend artifact. |

## 6. Medium / Cosmetic Language Issues

| Surface | Current text | Problem type | Recommended Russian wording | Severity | Notes |
|---|---|---|---|---|---|
| `components/admin/RevisionDiffPanel.js:21-25` and `components/admin/PreviewViewport.js:26-29` | `Показать в превью`, `Превью` | inconsistent terminology | `Показать в предпросмотре`, `Предпросмотр` | medium | Pick one canonical term and use it everywhere. `Предпросмотр` is the safer default. |
| `components/admin/MediaGalleryWorkspace.js:1330-1488` | `библиотека ассетов`, `быстрый inspector`, `usage`, `media workspace`, `draft asset`, `variant flow`, `preview` | mixed language / technical leakage | `библиотека медиафайлов`, `панель сведений`, `использование`, `рабочая зона медиатеки`, `черновая карточка`, `режим вариантов`, `предпросмотр` | medium | Important admin surface, but still secondary to the landing workspace rollout. |
| `components/admin/MediaCollectionOverlay.js:221-392` | `media workspace`, `usage`, `preview` | mixed language / awkward wording | `рабочая зона медиа`, `использование`, `предпросмотр` | medium | The overlay is already functionally clear; it mainly needs terminology cleanup. |
| `components/admin/MediaImageEditorPanel.js:252-293` | `draft-safe правки`, `preview`, `variant flow` | technical leakage / awkward wording | `безопасные для черновика правки`, `предпросмотр`, `рабочий поток вариантов` | medium | This is user-facing helper text, so the developer phrasing should be softened. |
| `components/admin/LlmDiagnosticsPanel.js:7-116` and `app/admin/(console)/diagnostics/llm/page.js:15-30` | `LLM Test`, `SOCKS5 Transport Test`, `HTTP status`, `Diagnostic kind`, `Effective provider`, `Trace ID`, `Request ID` | mixed language / acceptable technical carry-over | `Проверка LLM`, `Проверка SOCKS5-транспорта`, `Статус HTTP`, `Тип диагностики`, `Провайдер`, `ID трассировки`, `ID запроса` | medium | Superadmin-only, so this can be cleaned after the core landing workspace copy is fixed. |
| `components/admin/ServiceLandingWorkspacePanel.js:14-119` | `Service workspace state`, `Session identity`, `Editorial intent`, `Proof selection`, `Artifact state`, `Recent turn` | fully English / legacy holdover | Same Russian pattern as the landing panel: `Рабочая память`, `Сессия`, `Намерение правки`, `Выбор доказательств`, `Состояние артефакта`, `Журнал хода` | medium | This panel is transitional substrate, but it is still visible in the source editor rail. |

## 7. Proposed Canonical Glossary

| Concept | Canonical Russian UI term | Notes |
|---|---|---|
| landing workspace | `Рабочая зона лендингов` | Sidebar can stay short as `Лендинги`, but screen headers should be Russian. |
| Page truth | `Каноническая страница` | Use this instead of `Page truth` in user-facing copy. |
| Memory Card | `Рабочая память` | Keep `Memory Card` only in code/docs or parenthetical technical notes if absolutely needed. |
| preview | `Предпросмотр` | Use one form everywhere; do not mix with `превью`. |
| review | `Проверка` | Prefer `Проверка` / `На проверке` over raw `review`. |
| publish | `Публикация` | Avoid `выпуск`, unless a technical screen explicitly needs it. |
| turn log | `Журнал хода` | `Журнал сессии` is an acceptable fallback if the team wants simpler wording. |
| intent composer | `Постановка задачи` | Avoid `prompt` in user-facing labels. |
| candidate/spec | `Черновик` | `candidate/spec` should stay backend/doc-only. |
| blocker | `Блокирующая проблема` | Better than a bare English `blocker`. |
| evidence register | `Реестр доказательств` | This term is already good. |
| diagnostics | `Диагностика` | Keep `LLM` and `SOCKS5` as technical acronyms. |

## 8. Overall Verdict

- The admin UI is operationally usable and already fairly Russian in the shell, dashboard, publish, history, and review surfaces.
- The new landing workspace is not yet consistently Russian. It still has the highest language debt, and it mixes operator copy with developer vocabulary.
- The largest remaining issue is not a missing translation framework; it is a handful of hard-coded or legacy strings in the landing workspace, verification panels, media workspace, and diagnostics screen.
- The good news: this is a copy cleanup problem, not an architecture problem.

## 9. Smallest Correct Next Step

1. Russify the landing workspace chooser and dedicated workspace screen first.
2. Replace `candidate/spec`, `Page truth`, `Turn log`, `Open source editor`, `Open review`, and `Open draft review` with plain Russian operator wording.
3. Translate the Memory Card and verification panels next, because they are the primary review/readiness surfaces.
4. Then clean the legacy service-prefixed panels, media workspace, and superadmin diagnostics copy.
5. Keep `LLM`, `SEO`, and other technical acronyms only where they are genuinely helpful and do not read like accidental English leakage.
