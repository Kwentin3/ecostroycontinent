# ADMIN.ANAMNESIS.AI_LAYOUT_VS_PAGES_AUDIT.v1

## 1. Executive Summary

### Verdict

`Страницы` и `AI-верстка` не выглядят как два чисто разных продуктовых surface. По факту это один page workflow, размазанный на два top-level entry point.

Fact:
- `Страницы` заявлены как canonical editor standalone pages: `lib/admin/screen-copy.js:19`, `lib/admin/screen-copy.js:28`.
- `AI-верстка` сохраняет реальный `Page` draft через `saveDraft(ENTITY_TYPES.PAGE, ...)`: `app/api/admin/workspace/landing/[pageId]/route.js:221-257`, `:402-433`.
- В sidebar это два соседних primary раздела: `components/admin/AdminShell.js:9-18`, `lib/admin/nav.js:3-10`.

Inference:
- Главный конфликт не в publish, а в ownership и двойном входе в один и тот же write-side сценарий.

### Direct answers

1. Это не два независимых workflow; это один page workflow с размазанной ответственностью.
2. Canonical owner workflow должен оставаться у `Страницы` / `Page`.
3. `AI-верстка` естественнее трактуется как page-anchored assistive mode внутри page workflow.
4. Истинная точка сборки page composition сейчас лежит в цепочке `Page revision payload -> normalize/build -> published Page -> StandalonePage`, а не в одном конкретном экране.
5. Да, есть двойной вход в один бизнес-сценарий.
6. Да, есть поля и смыслы, редактируемые в обоих местах; часть полей workspace переносит скрыто.
7. Да, пользователь может менять данные в одном surface, а truth финально зафиксировать другим.
8. AI output не обходит `saveDraft` и publish gate, но обходит canonical page-editor UI contract и пишет в тот же `Page` truth альтернативным путём.
9. Самый дорогой seam: дублирующий projection layer между `Page payload`, flat editor fields, workspace draft и preview/report slices.
10. Наиболее естественная target-модель: `Страницы` = canonical owner, `AI-верстка` = subordinate assistive composition mode.

## 2. Scope and Sources

### Primary canon sources

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:68-70`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:101-104`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:254-258`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:323-330`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:353-356`
- `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md:18-21`
- `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md:63-68`
- `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md:79-90`

### Narrow docs tied to workspace/page surfaces

- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md:60-69`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md:107`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md:133-144`
- `docs/engineering/LANDING_WORKSPACE_TRACK1_WORKFLOW_AND_UI_PLAN_v1.md`
- `docs/engineering/LANDING_COMPOSITION_SPEC_CONTRACT_v1.md`

### Core code paths inspected

- nav: `components/admin/AdminShell.js`, `lib/admin/nav.js`
- page list/editor: `app/admin/(console)/entities/[entityType]/page.js`, `app/admin/(console)/entities/[entityType]/new/page.js`, `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- page editor contracts: `components/admin/EntityEditorForm.js`, `components/admin/EntityTruthSections.js`, `lib/admin/entity-ui.js`, `lib/admin/entity-form-data.js`, `app/api/admin/entities/[entityType]/save/route.js`
- workspace: `app/admin/(console)/workspace/landing/page.js`, `app/admin/(console)/workspace/landing/[pageId]/page.js`, `components/admin/LandingWorkspaceStageAScreen.js`, `lib/admin/landing-workspace.js`, `lib/admin/landing-workspace-ui.js`, `lib/landing-workspace/landing.js`, `lib/landing-workspace/session.js`, `app/api/admin/workspace/landing/[pageId]/route.js`
- downstream truth/read-side: `lib/content-core/pure.js`, `lib/content-core/schemas.js`, `lib/content-ops/readiness.js`, `lib/content-ops/workflow.js`, `app/admin/(console)/review/[revisionId]/page.js`, `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js`, `lib/read-side/public-content.js`, `components/public/PublicRenderers.js`

## 3. Canon Constraints

Fact:
- Content Core in SQL is source of truth: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:68-70`.
- `Page` owns standalone pages and page-level composition: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:101-104`.
- Publish is explicit; rollback = return to published revision: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:254-258`.
- AI is assistive only, not route owner, not source of truth: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md:323-330`, `:353-356`.
- Канон запрещает second competing model for media/SEO/review/publish и silent AI truth changes: `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md:63-68`, `:79-90`.
- Workspace planning doc прямо говорит, что screen не должен дублировать full canonical editor form: `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md:107`.

Inference:
- Правильная граница: `Page` owns truth; workspace may assist composition, but must not become peer owner.

## 4. Current Screen Inventory

### `Страницы`

Fact:
- top-level nav item `/admin/entities/page`: `components/admin/AdminShell.js:9-18`.
- canonical create flow from `/admin/entities/page/new`: `app/admin/(console)/entities/[entityType]/page.js:26-40`, `app/admin/(console)/entities/[entityType]/new/page.js:72-101`.
- edit surface exposes route/type/title/H1/content/relations/media/SEO: `components/admin/EntityTruthSections.js:321-417`.

### `AI-верстка`

Fact:
- separate top-level nav item `/admin/workspace/landing`: `components/admin/AdminShell.js:9-18`.
- chooser explicitly says it does not create pages, only attaches to existing `Page`: `app/admin/(console)/workspace/landing/page.js:35-50`.
- page editor also links into workspace: `app/admin/(console)/entities/[entityType]/[entityId]/page.js:82-85`.
- workspace links back to page editor: `components/admin/LandingWorkspaceStageAScreen.js:516-523`.

Inference:
- UX presents peer surfaces, while runtime semantics say workspace is dependent on `Page`.

## 5. Current User Flows

### Scenario matrix

1. New page from scratch:
- Entry: `/admin/entities/page` -> `/new`.
- Writes: canonical page form -> `/api/admin/entities/page/save` -> `saveDraft`.
- Owner is clear.

2. Existing/newly-created page through AI workspace:
- Entry: `/admin/workspace/landing` or CTA from page editor.
- Writes: workspace POST -> `/api/admin/workspace/landing/[pageId]` -> `saveDraft(page, ...)`.
- Handoff: back to review/publish generic flow.

3. Existing page edit in `Страницы`:
- Entry: `/admin/entities/page/[entityId]`.
- Writes: direct canonical fields and relations.

4. Re-open AI workspace for existing page:
- Entry either from chooser or page-editor CTA.
- Dependency: workspace session anchored to page in `app_sessions.workspace_memory_card`: `lib/landing-workspace/session.js:79-176`.

5. AI draft -> manual correction -> save:
- `generate_candidate` saves real `Page` draft: `app/api/admin/workspace/landing/[pageId]/route.js:402-433`.
- Manual workspace save also saves real `Page` draft: `:221-257`.

6. Change block composition after AI:
- Workspace edits materials/order/hero/CTA/content bands: `components/admin/LandingWorkspaceStageAScreen.js:705-903`.
- Projection goes back into page payload: `lib/landing-workspace/landing.js:380-406`.

7. Preview/publish/rollback:
- workspace preview is local/custom: `components/admin/LandingWorkspaceStageAScreen.js:332-412`.
- review/public preview use canonical renderer: `app/admin/(console)/review/[revisionId]/page.js:178-188`, `components/public/PublicRenderers.js:197-307`.
- publish/rollback remain explicit and shared: `lib/content-ops/workflow.js:172-299`.

8. If slug/title/SEO/layout change in different places:
- `Страницы` shows `slug`, `pageType`, SEO: `components/admin/EntityTruthSections.js:321-417`.
- workspace hides them but carries them in draft state and hidden payload: `lib/admin/landing-workspace-ui.js:66-96`, `components/admin/LandingWorkspaceStageAScreen.js:523-530`, `lib/landing-workspace/landing.js:380-406`.
- Risk: stale hidden overwrite.
9. If screen A expects work prepared in screen B:
- workspace cannot create owner `Page`; chooser requires it: `app/admin/(console)/workspace/landing/page.js:35-50`.
- route/type/SEO fixes require hop back to page editor: `components/admin/LandingWorkspaceStageAScreen.js:516-523`.
- composition/AI assistance requires hop from page editor into workspace: `app/admin/(console)/entities/[entityType]/[entityId]/page.js:82-85`.

10. Can workflow finish entirely in one screen?
- In `Страницы`: yes.
- In `AI-верстка`: no, not for full canonical field set.

Inference:
- `Страницы` already behave as complete owner workflow.
- `AI-верстка` behaves as alternate editor path for a subset of page truth, not as a self-sufficient but separate domain surface.

## 6. Ownership Matrix

| Meaning / field | Canon owner | Real persistence truth | `Страницы` | `AI-верстка` | Finding |
| --- | --- | --- | --- | --- | --- |
| `Page` existence | `Page` | DB entities + revisions | Yes | No direct create | clear |
| `pageType` | `Page` | revision payload | visible | hidden carry-through | drift risk |
| `slug` | `Page` | revision payload | visible | hidden carry-through | drift risk |
| `title` | `Page` | revision payload | yes | yes | dual-entry |
| `h1` / hero headline semantics | `Page` | revision payload/blocks | yes | yes | dual-entry |
| `intro` / hero body | `Page` | revision payload/blocks | yes | yes | dual-entry |
| body/content | `Page` | revision payload/blocks | yes | yes | dual-entry |
| CTA copy | `Page` | revision payload/blocks | yes | yes | dual-entry |
| service/case/gallery links | `Page` | revision payload/blocks | yes | yes | dual-entry |
| primary media | `Page` | revision payload | yes | yes | dual-entry |
| theme/tone/layout emphasis | `Page` | revision payload | partial | yes | workspace-biased |
| SEO | `Page` | revision payload.seo | visible | hidden carry-through | ambiguity |
| publish/review/rollback | workflow | revision state | shared | shared | aligned |
| generated draft | assistive layer | currently same Page draft + session memory | n/a | yes | ownership blur |
| preview | read-side projection | custom preview + review preview | indirect | yes | split |

Fact:
- Canonical page schema is `slug`, `pageType`, `pageThemeKey`, `title`, `h1`, `intro`, `blocks`, `primaryMediaAssetId`, `seo`: `lib/content-core/schemas.js:173-183`.
- Page editor is a flatten/unflatten façade: `lib/admin/entity-ui.js:92-125`, `lib/content-core/pure.js:42-130`.
- Workspace adds another representation: `lib/landing-workspace/landing.js:338-377`, `:380-406`.

Inference:
- Domain owner is still `Page`, but editing semantics are already split between two UI contracts.

## 7. Data / State / API Overlap

### Canonical page-editor save path

- form -> `buildEntityPayload()`: `lib/admin/entity-form-data.js:3-72`
- POST `/api/admin/entities/[entityType]/save`: `app/api/admin/entities/[entityType]/save/route.js:27-45`
- normalize into canonical `Page` payload: `lib/content-core/pure.js:42-130`

### Workspace save path

- hidden `payloadJson` from client: `components/admin/LandingWorkspaceStageAScreen.js:523-530`
- manual save: `app/api/admin/workspace/landing/[pageId]/route.js:221-257`
- AI generate: `app/api/admin/workspace/landing/[pageId]/route.js:402-433`
- both paths call `saveDraft(page, payload=...)`

### Transformation overlap

| Transformation | Module |
| --- | --- |
| `Page payload -> flat editor value` | `lib/admin/entity-ui.js:92-125` |
| `flat editor value -> canonical Page payload` | `lib/content-core/pure.js:42-130` |
| `Page payload -> workspace draft` | `lib/landing-workspace/landing.js:338-377` |
| `workspace draft -> page payload` | `lib/landing-workspace/landing.js:380-406` |
| `workspace draft -> preview payload` | `lib/landing-workspace/landing.js:459-467` |

### Preview split

Fact:
- workspace preview is custom/local: `components/admin/LandingWorkspaceStageAScreen.js:332-412`.
- review/public preview use the canonical renderer: `app/admin/(console)/review/[revisionId]/page.js:178-188`, `components/public/PublicRenderers.js:197-307`.

Inference:
- There is a preview drift seam before publish.

## 8. UX and Navigation Ambiguity

Fact:
- `AI-верстка` and `Страницы` are sibling items in sidebar: `components/admin/AdminShell.js:9-18`.
- `Страницы` copy explicitly claims one-flow truth editing: `lib/admin/screen-copy.js:19`, `:28`.
- `AI-верстка` has its own chooser, breadcrumbs, save/generate/review CTAs: `app/admin/(console)/workspace/landing/page.js:21-52`, `components/admin/LandingWorkspaceStageAScreen.js:508-977`.
- Workspace itself still labels the page as `Страница-источник`: `components/admin/LandingWorkspaceStageAScreen.js:508-515`.

Inference:
- The product tells the user two different truths at once: page editor is the owner, but workspace feels like another owner-grade editor.

## 9. Drift Against Canon

| Drift question | Finding |
| --- | --- |
| Did `AI-верстка` become page-builder-first? | Partially yes: it edits composition, block order, proof materials, preview, and handoff to review. |
| Did it become a second write-side owner? | Partially yes: it writes directly into `Page` draft. |
| Does `Страницы` duplicate what workspace does? | Yes, for copy, blocks, relations, media around standalone pages. |
| Did `Page` become second route owner for Service/Case/Article? | No evidence found here. |
| Is AI-assist boundary blurred? | Yes: assistive layer behaves like alternate editor path. |
| Is explicit publish posture broken? | No: publish/review/rollback remain explicit and shared. |

Fact:
- Canon forbids second competing model for media/SEO/review/publish: `docs/out/for chatGpt/02_Domain_and_Architecture_Boundaries_Экостройконтинент.md:63-68`, `:79-90`.

Inference:
- The drift is concentrated in edit/composition ownership, not in publish operations.

## 10. Risk Register

| ID | Problem | Severity | Risk type |
| --- | --- | --- | --- |
| R1 | Workspace is a second write-path into `Page` truth | Critical | ownership drift |
| R2 | Double entry into one page workflow via sibling nav | High | UX confusion, domain ambiguity |
| R3 | Hidden stale overwrite risk for `slug` / `pageType` / `seo` | High | state inconsistency, validation mismatch |
| R4 | Duplicate transformation layer across editor/workspace/page payload | High | duplicated logic, maintainability risk, future refactor trap |
| R5 | Workspace preview is not canonical preview | Medium | UX confusion, future refactor trap |
| R6 | Forced hop in both directions between screens | Medium | UX confusion, ownership drift |
| R7 | Product copy says Pages own the flow, runtime suggests another editor | Medium | domain ambiguity |
| R8 | Workspace introduces alternate page representation | Medium | future refactor trap |

Evidence summary:
- R1: `app/api/admin/workspace/landing/[pageId]/route.js:221-257`, `:402-433`
- R2: `components/admin/AdminShell.js:9-18`, `lib/admin/nav.js:3-10`
- R3: `lib/admin/landing-workspace-ui.js:66-96`, `components/admin/LandingWorkspaceStageAScreen.js:523-530`, `lib/landing-workspace/landing.js:380-406`
- R4: `lib/admin/entity-ui.js:92-125`, `lib/content-core/pure.js:42-130`, `lib/landing-workspace/landing.js:338-467`
- R5: `components/admin/LandingWorkspaceStageAScreen.js:332-412`, `app/admin/(console)/review/[revisionId]/page.js:178-188`
## 11. Options for Target Model

### Option A. Keep both as peer top-level screens and only tighten copy

Assessment:
- Lowest disruption.
- Does not remove the fact that both surfaces write the same `Page` truth.
- Does not cut the duplicate projection seam.

Verdict:
- Not recommended.

### Option B. Treat `AI-верстка` as page-anchored assistive composition mode inside page workflow

Assessment:
- Matches canon.
- Matches workspace planning docs, where source editor remains truth-editing surface: `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md:107`, `:133-144`.
- Preserves AI-assisted composition help without making AI the second owner of truth.

Verdict:
- Recommended.

### Option C. Make `AI-верстка` the main page editor and reduce `Страницы` to metadata shell

Assessment:
- Conflicts with canon: Admin-first content ops, not page-builder-first.
- Conflicts with AI-not-owner posture.

Verdict:
- Not allowed by canon.

## 12. Recommended Direction

Recommended target model:
- `Страницы` remain canonical owner workflow for standalone page truth.
- `AI-верстка` is a subordinate, page-anchored assistive composition mode/tool.
- route/type/SEO/publish/review/history stay canonical under `Page`.
- future refactor should cut duplicate transformations before expanding workspace scope.

## 13. Open Questions

1. Нужен ли `AI-верстка` как самостоятельный nav destination, если его правильная роль subordinate assistive mode?
2. Должен ли workspace иметь право сохранять canonical Page draft напрямую, или output должен быть более явно staged/reconciled?
3. Какие поля workspace может менять canonically без возврата в page editor?
4. Должен ли workspace preview перейти на тот же renderer, что review/public preview?
5. Должен ли custom workspace draft model остаться отдельной representation layer?

## 14. Suggested Next Epics (without implementation)

1. Зафиксировать ownership-модель `Page vs AI workspace` отдельным decision doc.
2. Описать hard boundary: какие поля редактируются только в `Страницы`, какие допустимы в workspace.
3. Спроектировать reduction/elimination duplicate transformations.
4. Спроектировать single preview contract для workspace/review/public.
5. Спроектировать навигацию, в которой workspace не выглядит peer owner surface.

## Appendix A. Таблица “что редактируется где”

| Meaning | `Страницы` | `AI-верстка` | Notes |
| --- | --- | --- | --- |
| Create `Page` | Yes | No | workspace depends on existing page |
| `slug` | Yes visible | hidden carry-through | high drift risk |
| `pageType` | Yes visible | hidden carry-through | high drift risk |
| `title` | Yes | Yes | duplicate entry |
| `h1` / hero headline | Yes | Yes | duplicate meaning |
| `intro` / hero body | Yes | Yes | duplicate meaning |
| body/content | Yes | Yes | different representations |
| CTA fields | Yes | Yes | duplicate meaning |
| service/case/gallery links | Yes | Yes | duplicate relation editing |
| primary media | Yes | Yes | duplicate relation editing |
| theme/tone/layout | Partial | Yes | workspace-biased |
| SEO | Yes visible | hidden carry-through | dangerous ambiguity |
| review/publish/rollback | shared | shared | downstream canonical operations |

## Appendix B. Таблица “какой экран от какого зависит”

| Screen | Depends on | Evidence |
| --- | --- | --- |
| `Страницы` list/editor | canonical `Page` entity and revision system | `app/admin/(console)/entities/[entityType]/page.js`, `app/api/admin/entities/[entityType]/save/route.js` |
| `AI-верстка` chooser | existing `Page` rows | `app/admin/(console)/workspace/landing/page.js:35-50` |
| `AI-верстка` workspace | source revision, current draft, session memory, published lookups | `lib/admin/landing-workspace.js:41-150` |
| `AI-верстка` save | `saveDraft(ENTITY_TYPES.PAGE)` | `app/api/admin/workspace/landing/[pageId]/route.js:221-257`, `:402-433` |
| Review | revision payload from either entry path | `app/admin/(console)/review/[revisionId]/page.js:178-188` |
| Publish | readiness + review state | `lib/content-ops/workflow.js:172-273` |

## Appendix C. Таблица “какие трансформации данных происходят между AI и Page”

| From | To | Module |
| --- | --- | --- |
| `Page payload.blocks` | flat page editor fields | `lib/admin/entity-ui.js:92-125` |
| flat page editor fields | canonical `Page payload.blocks` | `lib/content-core/pure.js:42-130` |
| canonical `Page payload` | workspace draft model | `lib/landing-workspace/landing.js:338-377` |
| workspace draft model | page-like payload | `lib/landing-workspace/landing.js:380-406` |
| workspace draft model | normalized preview payload | `lib/landing-workspace/landing.js:459-467` |
| workspace client state | hidden serialized payload | `components/admin/LandingWorkspaceStageAScreen.js:523-530` |

## Appendix D. Список конкретных файлов/модулей, которые формируют проблему

- Navigation ambiguity: `components/admin/AdminShell.js`, `lib/admin/nav.js`, `lib/admin/screen-copy.js`
- Canonical page contract: `app/admin/(console)/entities/[entityType]/page.js`, `app/admin/(console)/entities/[entityType]/new/page.js`, `app/admin/(console)/entities/[entityType]/[entityId]/page.js`, `components/admin/EntityEditorForm.js`, `components/admin/EntityTruthSections.js`, `lib/admin/entity-ui.js`, `lib/admin/entity-form-data.js`, `app/api/admin/entities/[entityType]/save/route.js`, `lib/content-core/pure.js`, `lib/content-core/schemas.js`
- Workspace alternate contract: `app/admin/(console)/workspace/landing/page.js`, `app/admin/(console)/workspace/landing/[pageId]/page.js`, `components/admin/LandingWorkspaceStageAScreen.js`, `lib/admin/landing-workspace.js`, `lib/admin/landing-workspace-ui.js`, `lib/landing-workspace/landing.js`, `lib/landing-workspace/session.js`, `app/api/admin/workspace/landing/[pageId]/route.js`
- Shared downstream truth path: `lib/content-ops/readiness.js`, `lib/content-ops/workflow.js`, `app/admin/(console)/review/[revisionId]/page.js`, `app/admin/(console)/entities/[entityType]/[entityId]/history/page.js`, `lib/read-side/public-content.js`, `components/public/PublicRenderers.js`
