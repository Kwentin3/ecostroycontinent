# PLAN.PAGE_WORKSPACE_REMEDIATION_REFACTOR.v1

Статус: proposed remediation/refactor plan  
Дата: 2026-04-11  
Основание: full page workspace audit, current single-workflow implementation, bounded operator-quality remediation

## 1. Goal and Boundaries

Цель этого плана - довести page workspace до спокойного ежедневного инструмента SEO-специалиста без переоткрытия уже правильной single-workflow architecture.

План сознательно не предлагает новый redesign. Он исходит из того, что базовая модель уже верна:
- один пользовательский домен `Страницы`;
- registry-first entry;
- unified page workspace;
- `Page` as canonical owner;
- metadata как отдельный management layer;
- AI как assistive only;
- preview на canonical `StandalonePage` renderer.

### Hard boundaries

- Не переоткрывать route ownership и single-workflow model.
- Не превращать remediation в generic page-builder expansion.
- Не переносить центр тяжести в metadata layer.
- Не размывать explicit review / publish / history semantics.
- Не создавать новый truth-store, второй draft-flow или второй editor narrative.
- Локальные bugs называть локальными bugs, а не архитектурными проблемами.

## 2. Audit Findings Recap

По итогам полного аудита page workspace зафиксированы следующие проблемы.

### P0

1. Страницы со статусом `Нет версии` открываются в `500 This page couldn't load` вместо честного empty workspace state.

### P1

2. Default CTA copy в preview / review отображается в mojibake.
3. Нет явного delete/archive management path для страницы в registry / workspace.
4. AI action wording / target UX неочевидны: оператор может ожидать patch для связки, а получить patch hero-зоны.

### P2

5. Empty states в pickers `Услуги` / `Кейсы` почти не объясняют, что делать дальше.
6. Tablet preview почти не отличается от desktop.
7. Header workspace перегружен объяснительным системным текстом.
8. AI panel даёт слабый progress / result feedback.

## 3. Finding Classification

| Finding | Class | Severity | Why it matters | Affected operator flow | Scope |
| --- | --- | --- | --- | --- | --- |
| Pages with `Нет версии` open in `500` | Functional blocker | Critical | Оператор не может вообще открыть часть страниц из реестра | Open page from registry | Cross-cutting through data + preview seam |
| Mojibake default CTA copy | Content / encoding defect | High | Preview/review выглядят сломанными и снижают доверие к контенту | Preview, review, first-save defaults | Shared content-default seam |
| Missing delete/archive path | Lifecycle / operator management gap | High | Нет понятного bounded управления жизненным циклом страницы | Registry operations, workspace management | Shared lifecycle gap |
| AI target/action mismatch | UX clarity issue | High | AI action может семантически удивить и подорвать доверие к assistive panel | AI-assisted editing | Mostly localized UX seam |
| Empty states in Cases/Services pickers | Functional completeness gap | Medium | Пользователь не понимает, почему нет данных и что делать дальше | Source insertion | Localized empty-state seam |
| Weak AI progress/result feedback | UX clarity issue | Medium | Оператор не уверен, сработало ли действие и куда применился patch | AI usage loop | Localized UX seam |
| Tablet preview weakly distinct | Nice-to-have polish | Medium | У preview ниже practical value for responsive check | Preview inspection | Localized preview UI seam |
| Overloaded workspace header | UX clarity issue | Medium | Ежедневная работа нагружается системным текстом | Daily editing loop | Localized screen shell seam |

## 4. Current-to-Fix Seam Map

### 4.1 Pages without revision -> `500`

- Likely seam type: `data seam` + `preview seam`
- Likely cause:
  - page workspace bootstrap tolerates missing revision poorly;
  - preview payload still normalizes through page schema that requires non-empty `title` and `h1`;
  - empty page currently crashes instead of rendering an operator-safe blank state.
- Evidence zone:
  - `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
  - `app/api/admin/entities/page/[pageId]/workspace/route.js`
  - `lib/admin/page-workspace.js`
  - `lib/content-core/pure.js`
  - `lib/content-core/schemas.js`
- Fix locality: medium. Needs route/bootstrap/preview guard, but should preserve existing page contract.
- Recommended posture: honest empty workspace shell first; no implicit hidden draft creation during page open.

### 4.2 Mojibake default CTA

- Likely seam type: `encoding/content normalization problem`
- Likely cause:
  - corrupted default Russian literals in content default builder;
  - preview/review correctly render what they receive, so symptom is upstream content corruption.
- Evidence zone:
  - `lib/content-core/pure.js`
  - downstream visible in `components/admin/PageWorkspaceScreen.js` and review/public renderer output
- Fix locality: localized source fix plus verification across consumers.
- Shared contract risk: moderate. Fix must target origin of defaults, not patch preview only.

### 4.3 Missing delete/archive path

- Likely seam type: `lifecycle gap`
- Likely cause:
  - single-workflow refactor preserved create/edit/review path but left bounded operator lifecycle management outside first slice.
- Evidence zone:
  - `components/admin/PageRegistryClient.js`
  - `components/admin/PageWorkspaceScreen.js`
  - existing registry card menus and workspace action cluster
- Fix locality: medium. Requires explicit domain decision and UI affordance, but should reuse existing entity lifecycle semantics if available.
- Shared contract risk: high if delete/archive collides with review/history rules.

### 4.4 AI target/action mismatch

- Likely seam type: `UX wording/feedback problem`
- Likely cause:
  - action labels sound domain-level (`Предложить связку`), while effective target depends on currently active editable zone;
  - target context is not strong enough before submit;
  - result feedback does not clearly bind returned patch to target.
- Evidence zone:
  - `components/admin/PageWorkspaceScreen.js`
  - AI panel action buttons and active-target summary
- Fix locality: localized UI/interaction refinement.
- Shared contract risk: low if bounded patch semantics stay unchanged.

### 4.5 Empty source picker states

- Likely seam type: `empty-state problem`
- Likely cause:
  - picker modals assume content exists and do not explain next step when source domain is empty.
- Evidence zone:
  - source picker modal sections inside `components/admin/PageWorkspaceScreen.js`
- Fix locality: localized.
- Shared contract risk: low.

### 4.6 Tablet preview parity

- Likely seam type: `preview seam`
- Likely cause:
  - width presets are too close, so tablet mode gives weak signal.
- Evidence zone:
  - `components/admin/PreviewViewport.js`
- Fix locality: localized UI polish.
- Shared contract risk: low if renderer stays canonical.

### 4.7 Overloaded header

- Likely seam type: `UX wording/feedback problem`
- Likely cause:
  - first-slice shell overcompensates with explanatory text that is useful once but heavy in daily use.
- Evidence zone:
  - `components/admin/PageWorkspaceScreen.js`
- Fix locality: localized shell cleanup.
- Shared contract risk: low.

## 5. Proposed Refactor Phases

### Phase A — P0 blocker fix: safe open for pages without revision

**Goal**  
Страница со статусом `Нет версии` должна открываться в честный empty workspace state без `500`.

**Why this phase matters**  
Пока часть страниц из реестра физически не открывается, workspace нельзя считать надёжным рабочим инструментом.

**User-visible result**
- Любая страница из реестра открывается.
- Для страниц без revision оператор видит понятный empty state.
- Empty state подсказывает следующий шаг: заполнить базовый контент и сохранить первый draft.

**Likely code zones**
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`
- `lib/admin/page-workspace.js`
- `lib/content-core/pure.js`
- `lib/content-core/schemas.js`
- `tests/page-workspace.route.test.js`

**Contracts to preserve**
- `Page` remains owner.
- No hidden auto-publish or hidden draft mutation on page open.
- Preview still uses canonical page renderer or a safe empty adapter around it.

**Risks**
- Fix may silently auto-create canonical content on mere open.
- Empty shell may drift into a second create-flow if too much scaffolding is generated automatically.

**Acceptance criteria**
- Page with `Нет версии` opens without server crash.
- Operator sees explicit empty workspace state, not broken preview.
- First save still happens only via explicit user action.
- Existing pages with revisions behave unchanged.

**Rollback / fallback posture**
- If full empty-state integration is riskier than expected, first introduce guarded route/bootstrap + minimal non-crashing placeholder while preserving explicit save.

### Phase B — Content/encoding integrity

**Goal**  
Убрать mojibake из default CTA / related default copy at source.

**Why this phase matters**  
Это дефект доверия: оператор видит «битый» русский текст прямо в preview/review.

**User-visible result**
- Default CTA copy читается нормально в workspace preview и review.
- Новые первые drafts не наследуют испорченный default text.

**Likely code zones**
- `lib/content-core/pure.js`
- `lib/content-core/schemas.js` if normalization references defaults
- preview/review smoke coverage

**Contracts to preserve**
- Existing page payload shape.
- Existing preview and review rendering path.

**Risks**
- Симптом можно починить только в preview, оставив source corruption живой.
- Existing corrupted stored drafts may need explicit migration decision later.

**Acceptance criteria**
- Default CTA text renders as proper Russian strings.
- New draft scaffolds and preview/review use the corrected source.
- No regression in page payload validation.

**Rollback / fallback posture**
- If stored historical data complicates rollout, still ship source fix first and treat historical backfill as separate bounded follow-up.

### Phase C — Operator lifecycle management

**Goal**  
Добавить discoverable bounded path для archive/delete management, не ломая review/history canon.

**Why this phase matters**  
SEO-оператору нужен понятный жизненный цикл страницы, а не только create/edit/review.

**User-visible result**
- В registry и/или workspace есть явный lifecycle action.
- Оператор понимает, может ли он архивировать страницу, удалить черновик или почему действие недоступно.

**Likely code zones**
- `components/admin/PageRegistryClient.js`
- `components/admin/PageWorkspaceScreen.js`
- `app/api/admin/entities/[entityType]/...` lifecycle handlers
- existing entity service / list visibility helpers

**Contracts to preserve**
- Explicit review/history invariants.
- No silent hard delete of publish-critical history without domain decision.

**Risks**
- Hard delete may collide with revision/audit requirements.
- Archive semantics may become ambiguous if registry filters are not aligned.

**Acceptance criteria**
- Lifecycle action is discoverable from registry and/or workspace.
- Operator gets bounded confirmation and understandable result.
- Review/history semantics remain intact.
- Out-of-policy actions are blocked with explicit explanation.

**Rollback / fallback posture**
- If delete semantics are not ready, ship archive/deactivate first and leave hard delete out of first remediation slice.

### Phase D — Source picker operator clarity

**Goal**  
Сделать empty states в `Услуги` / `Кейсы` понятными и actionable, не раздувая source management.

**Why this phase matters**  
Сейчас пустая модалка выглядит как недоработка, а не как осмысленное состояние данных.

**User-visible result**
- Empty picker explains why the list is empty.
- Operator sees what to do next: создать источник, проверить фильтр, либо вернуться без ошибки.

**Likely code zones**
- `components/admin/PageWorkspaceScreen.js`
- source picker helper text / modal components

**Contracts to preserve**
- Launcher model stays compact.
- Picker still returns page-owned refs/order only.

**Risks**
- Empty-state improvement may drift into big source-management surface.

**Acceptance criteria**
- Empty picker clearly states no records found.
- Empty picker gives one bounded next-step hint.
- No regression in picker selection for non-empty domains.

### Phase E — AI interaction clarity

**Goal**  
Сделать AI panel предсказуемой: что именно она меняет, где идёт работа и какой patch вернулся.

**Why this phase matters**  
Сейчас AI формально bounded, но по UX может удивлять и снижать доверие.

**User-visible result**
- Before action, operator clearly sees current target zone.
- Action labels and helper copy align with actual patch semantics.
- During request, there is visible progress.
- After request, result ties returned patch to target more explicitly.

**Likely code zones**
- `components/admin/PageWorkspaceScreen.js`
- AI action metadata / action labels
- AI request state and result feedback components

**Contracts to preserve**
- AI stays assistive only.
- Patch-only / explicit apply semantics stay unchanged.
- AI cannot mutate metadata, route ownership, publish state.

**Risks**
- Over-fixing clarity can make AI panel too prominent and editor-like.
- Target binding can become too rigid if implemented as hidden coupling.

**Acceptance criteria**
- AI action label no longer semantically surprises operator.
- Active target is visible before submit.
- In-flight state is visible.
- Returned patch/result explains what changed and where.
- Manual editing remains the obvious primary mode.

### Phase F — Workspace UX polish

**Goal**  
Снять повседневное UX-трение в shell и preview without redesign.

**Why this phase matters**  
После P0/P1 fixes ежедневная ценность workspace зависит от calm operator experience.

**User-visible result**
- Header becomes lighter and less lecture-like.
- Tablet preview gives meaningfully different inspection width.
- Supporting feedback feels calmer and more legible.

**Likely code zones**
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PreviewViewport.js`

**Contracts to preserve**
- Same screen structure: left launcher rail, center canvas, right AI panel.
- Same canonical preview renderer.

**Risks**
- Header simplification can remove too much operator guidance.
- Preview polish can drift into broad visual redesign.

**Acceptance criteria**
- Header keeps only high-signal operational guidance.
- Tablet width preset is materially distinct from desktop.
- No regression in preview rendering or workspace layout.

## 6. Decision Points

| Decision needed | Recommended choice | Why |
| --- | --- | --- |
| How should pages without revision open? | Honest empty safe shell, not hidden auto-scaffold draft | Preserves explicit save semantics and avoids hidden create narrative on open |
| Delete vs archive vs both in first remediation slice? | Archive/deactivate first; hard delete only if a pre-existing bounded contract exists for safe draft-only removal | Lowest risk to review/history canon and operator expectations |
| How to fix mojibake? | Fix source literals and normalization origin, then verify downstream preview/review; treat historical backfill separately if needed | Patches the cause, not just the visible symptom |
| How to improve AI clarity? | Change both action wording and target visibility, plus add in-flight/result feedback | Label-only change is insufficient if target remains implicit |
| How should tablet preview improve? | Adjust width presets only; keep same preview architecture | Gives practical value without reopening preview design |
| What to do with overloaded header? | Reduce and collapse explanatory text, keep only high-signal operational copy | Low-risk polish that preserves current shell |
| What should empty pickers communicate? | Explain emptiness and suggest one next action; do not expose full source-management surface | Keeps launcher model bounded |

## 7. Acceptance Criteria Matrix

| Finding | Acceptance criteria |
| --- | --- |
| No-revision pages crash | `Page` with `Нет версии` opens without `500`; operator sees intelligible empty workspace; explicit first save creates first draft |
| Mojibake CTA copy | Default CTA / default visible copy render correctly in workspace preview and review; no broken Russian literals remain in default builder |
| Missing delete/archive path | Registry/workspace exposes discoverable lifecycle action; operator understands when archive/delete is available or blocked |
| AI target/action mismatch | Action wording aligns with actual target; active target is visible; returned patch is clearly tied to selected zone |
| Empty Cases/Services pickers | Empty modal explains absence of source records and suggests one bounded next step |
| Weak AI feedback | In-flight state and result summary are visible and comprehensible |
| Weak tablet preview | Tablet preset is materially distinct from desktop while using same canonical renderer |
| Overloaded header | Header text is shorter, clearer, and does not dominate above-the-fold workspace area |

## 8. Risks and Mitigations

| Risk | Severity | Trigger | Mitigation | Detection signal |
| --- | --- | --- | --- | --- |
| No-revision fix reintroduces hidden create-flow | High | Page open auto-generates canonical draft implicitly | Keep open path read-only; create first draft only on explicit save | New revisions appear after open without save |
| Delete/archive collides with review/history invariants | High | Lifecycle action mutates entities with active history/review dependencies | Start with bounded archive/deactivate semantics; add explicit policy checks | Review/history pages break or archived pages vanish unexpectedly |
| Mojibake fix patches symptom only | Medium | Only preview strings are corrected | Fix source default literals and add smoke verification at builder level | New drafts still generate corrupted copy |
| AI clarity fix makes AI too prominent | Medium | Panel gains excessive callouts or primary-CTA treatment | Keep manual editing primary; AI remains secondary rail | Operator attention shifts to AI as main editing path |
| Empty-state improvement drifts into source-management product | Low | Picker starts embedding creation flows and heavy guidance | Limit to explanation + next-step hint/link only | Picker modal grows into mini dashboard |
| Header simplification removes needed guidance | Low | Too much explanatory copy removed | Preserve one-line context and keep advanced help collapsible | New operators ask “что здесь делать?” more often |
| Preview polish drifts into redesign | Low | Tablet work expands into multi-device preview overhaul | Limit scope to width presets and labels | Preview component rewrite grows beyond local change |

## 9. Recommended Delivery Order

### Recommended order

1. **Phase A** — fix pages without revision.  
   This is the only confirmed blocker and should be treated as the next immediate implementation epic.
2. **Phase B** — fix mojibake source defaults.  
   Small, high-confidence quality repair with clear operator value.
3. **Phase D** + **Phase E** — source picker clarity and AI clarity.  
   These can be implemented in parallel if ownership is split cleanly because they are localized UI remediations.
4. **Phase C** — lifecycle management.  
   Do after explicit policy decision on archive/delete semantics.
5. **Phase F** — header and tablet-preview polish.  
   End-of-batch calmer UX cleanup after blockers and P1 issues are stabilized.

### Practical batching guidance

- **PR 1**: Phase A alone. Needs focused verification because it touches bootstrap and preview safety.
- **PR 2**: Phase B plus regression smoke for preview/review.
- **PR 3a**: Phase D. Localized picker UX improvements.
- **PR 3b**: Phase E. Localized AI clarity and feedback improvements.
- **PR 4**: Phase C. Separate because lifecycle semantics need a clear policy decision and higher regression sensitivity.
- **PR 5**: Phase F. Safe polish batch.

### Parallelization guidance

Can run in parallel:
- Phase D and Phase E.
- Phase F design copy work after Phase A code path is stable.

Should not run in parallel:
- Phase A with any deep preview changes.
- Phase C with unrelated lifecycle or review-flow work.

### Extra verification passes needed

- After Phase A: targeted verification on 10-15 pages including `Нет версии`, published, draft-only, and reviewed pages.
- After Phase B: preview/review textual smoke on fresh default page payload.
- After Phase C: lifecycle regression against registry filters, review/history visibility, and any archive list behavior.
- After Phase E: manual operator smoke to ensure AI remains assistive and not surprising.

## 10. What Should Explicitly Stay Out of Scope

- Redesign of the whole page workspace shell.
- Reopening single-workflow architecture.
- Generic page-builder expansion.
- Reworking metadata modal unless directly required by a specific bug.
- New AI capabilities beyond clearer bounded patch UX.
- Broad source-management product for services/cases/media.
- Public-site redesign or non-page admin surfaces.
- Historical content migration beyond what is minimally required to stop generating corrupted defaults.
