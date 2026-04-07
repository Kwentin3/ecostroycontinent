# LANDING_WORKSPACE_UI_SURFACE_AUDIT_v1

Overall verdict: `OVERLOADED`.

This audit reviews the actual landing-first workspace screen at `/admin/workspace/landing/[pageId]` from the point of view of operator usability: what is on the first screen, what decision it supports, and whether it deserves first-layer visibility.

Evidence classes used in this audit:

- `code-verified` - confirmed in repository code and tests.
- `runtime-verified` - confirmed on the live deployed runtime.
- `report-asserted only` - stated in prior reports, but not used here as decisive evidence.

No screenshots were attached in this turn, and the Playwright browser backend was unavailable, so exact pixel-level dominance is code-inferred rather than screenshot-verified.

## 1. Audit Scope

This is a UI surface audit only. No implementation changes were made.

The scope is the landing workspace screen itself, plus the shell chrome that is always visible around it:

- admin sidebar / shell,
- top bar / breadcrumbs / page actions,
- left column context surfaces,
- center preview and interaction shell,
- right column verification and handoff surfaces,
- below-the-fold technical content that remains visible in the same screen.

This audit does not judge the product canon, prompt architecture, or session semantics in depth except where they affect what operators see.

## 2. Sources Checked

### Product and workspace docs

- `docs/product-ux/PRD_Landing_Factory_Экостройконтинент_v0.2-draft.md`
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/engineering/LANDING_FIRST_WORKSPACE_EXECUTION_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_SCREEN_IMPLEMENTATION_PLAN_v1.md`
- `docs/engineering/AI_WORKSPACE_LAYERED_ARCHITECTURE_PLAN_v1.md`
- `docs/engineering/MEMORY_CARD_DOMAIN_MAP_v1.md`
- `docs/engineering/MEMORY_CARD_PROMPT_CONTEXT_CONTRACT_v1.md`

### Prior reports used as context

- `docs/reports/LANDING_FIRST_WORKSPACE_EXECUTION_v1.report.md`
- `docs/reports/LANDING_FIRST_WORKSPACE_REALITY_AUDIT_v1.report.md`
- `docs/reports/UI_RUSSIFICATION_AUDIT_v1.report.md`
- `docs/reports/UI_RUSSIFICATION_POST_CHECK_v1.report.md`
- `docs/reports/LANDING_WORKSPACE_PRD_DOCS_EXPECTATION_AUDIT_v1.report.md`

### Code and tests

- `components/admin/AdminShell.js`
- `lib/admin/nav.js`
- `components/admin/SurfacePacket.js`
- `components/admin/PreviewViewport.js`
- `components/admin/LandingWorkspaceMemoryPanel.js`
- `components/admin/LandingWorkspaceVerificationPanel.js`
- `components/admin/admin-ui.module.css`
- `app/admin/(console)/workspace/landing/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `lib/admin/landing-workspace.js`
- `lib/landing-workspace/session.js`
- `lib/landing-workspace/landing.js`
- `lib/ai-workspace/prompt.js`
- `lib/llm/facade.js`
- `tests/landing-workspace.test.js`
- `tests/landing-workspace.route.test.js`
- `tests/admin-shell.test.js`

### Runtime evidence

- `POST https://ecostroycontinent.ru/api/admin/login` returned `303` and set a valid admin session cookie.
- `GET https://ecostroycontinent.ru/admin/workspace/landing/entity_5537b3a0-c96a-466d-9f3a-d46098d9402c` returned `200` under that authenticated session.
- `GET https://ecostroycontinent.ru/admin/login` returned the Russian login gate.

What is still not independently verified in-browser in this turn:

- the exact live pixel layout of the authenticated workspace screen,
- the exact visual dominance of preview versus the technical rails,
- the full click-through feel from chooser to workspace to source editor to review.

## 3. Current Visible Screen Map

### Shell and sidebar

- Visible blocks: `Админка`, role label, navigation items, infra footer, logout.
- Purpose: global admin navigation and environment awareness.
- Operator decision supported: where to go next outside the workspace.
- Main-task relevance: secondary.

### Top bar

- Visible blocks: breadcrumbs `Админка / AI-верстка / {page}`, title `Рабочая зона лендинга · {pageLabel}`, actions `Открыть редактор страницы` and `К выбору лендинга`.
- Purpose: orient the operator and provide immediate escape / handoff actions.
- Operator decision supported: which page is being edited and whether to jump back to the source editor.
- Main-task relevance: primary.

### Left column

- Visible blocks: `Страница-источник` card, `Память сессии` panel, `Последние действия` card.
- Purpose: anchor the page owner, show session state, and summarize recent movement.
- Operator decision supported: what page this is, what session state exists, and what happened most recently.
- Main-task relevance: mixed. The source anchor is primary; the memory/session details are too technical for the first layer.

### Center

- Visible blocks: `Предпросмотр` viewport and `Постановка задачи` / `Что хотим изменить` composer.
- Purpose: show the current projection and capture the next edit intent.
- Operator decision supported: how the page currently looks and what should change next.
- Main-task relevance: primary.

### Right column

- Visible blocks: `Отчет по лендингу` verification panel and `Следующий шаг` handoff card.
- Purpose: show readiness / blockers and move the operator into review.
- Operator decision supported: what blocks progress and what the next handoff action is.
- Main-task relevance: mixed. The handoff card is primary; the report panel is too technical for the first layer.

### Overflow / below-the-fold content

- Visible blocks inside the verification panel: section projection table, class results, blocking issues, `Путь LLM`, IDs and state chips.
- Purpose: detailed inspection of candidate correctness.
- Operator decision supported: diagnosis and escalation, not first-pass composition.
- Main-task relevance: technical.

## 4. What Supports the Main Operator Task

| Block | Verdict | Why it helps |
|---|---|---|
| Top bar / breadcrumbs / source-editor CTA | `FITS THE MAIN TASK` | It tells the operator where they are and gives a direct way back to the canonical source editor. |
| `Страница-источник` card | `FITS THE MAIN TASK` | It anchors the workspace to the owner page and shows draft / published state. |
| `Предпросмотр` viewport | `FITS THE MAIN TASK` | It shows the current projection the operator is actually working on. |
| `Постановка задачи` composer | `FITS THE MAIN TASK` | It captures the next change intent without turning the screen into freeform chat. |
| `Передать на проверку` / review handoff | `FITS THE MAIN TASK` | It keeps publish/review explicit and human-controlled. |
| Bounded action strip (`Сгенерировать черновик`, `Сгенерировать заново`) | `FITS THE MAIN TASK` | It preserves the intended one-step action model. |

The interaction model itself is not the problem. It is bounded and does not drift into a prompt lab or general chat product.

## 5. What Is Secondary but Acceptable

| Block | Verdict | Why it is acceptable |
|---|---|---|
| Sidebar navigation | `ACCEPTABLE BUT SECONDARY` | Operators do need the shell, but it should not compete with the workspace content. |
| Device toggles in preview (`Компьютер`, `Планшет`, `Телефон`) | `ACCEPTABLE BUT SECONDARY` | Useful for checking responsive view, but not the main task. |
| `Последние действия` summary | `ACCEPTABLE BUT SECONDARY` | Helpful as a short history strip, provided it stays short. |
| Source card draft / published chips | `ACCEPTABLE BUT SECONDARY` | They are useful orientation data, but the current count is already close to too noisy. |
| `Следующий шаг` handoff card | `ACCEPTABLE BUT SECONDARY` | Good to keep visible, but it should stay compact and not become a second verification report. |

## 6. What Is Technical Leakage / Overload

| Block name | Current placement | Current purpose | Operator value | Priority | Keep / simplify / collapse / move / remove | Rationale |
|---|---|---|---|---|---|---|
| Sidebar infra footer | Bottom of admin shell sidebar | Live infra telemetry (`S3`, `CDN`, hosts, probe state) | Low | `TOO TECHNICAL FOR MAIN LAYER` | Collapse / move | This is engineering telemetry, not landing composition work. It steals attention from the workspace. |
| `Память сессии` panel | Left column, first screen layer | Session identity, intent, proof selection, trace, decisions, last step | Medium-low | `SHOULD BE COLLAPSED` | Move | It is useful state, but the first layer is too verbose and exposes internal IDs too early. |
| `Отчет по лендингу` panel header chips | Right column, first screen layer | Status, section count, approval / render / publish readiness | Medium | `OVERLOADED` | Simplify | Too many status chips at once make the screen feel diagnostic rather than compositional. |
| Section projection table | Inside verification panel | Section-by-section render projection | Technical | `SHOULD BE COLLAPSED` | Move | This belongs in a detail view, not the main operator layer. |
| Class results list | Inside verification panel | Per-class status and issue codes | Technical | `SHOULD BE COLLAPSED` | Move | It is evidence for debugging, not the first thing an operator needs. |
| `Путь LLM` line | Inside verification panel | Provider/model/transport/state chain | Technical | `TOO TECHNICAL FOR MAIN LAYER` | Collapse | The operator only needs a concise readiness signal, not the transport path. |
| Internal IDs (`sessionId`, `entityId`, `candidateId`, `landingDraftId`, `specVersion`, `requestId`, `lastLlmTraceId`) | Spread across memory and verification panels | Internal state tracking | Technical | `TOO TECHNICAL FOR MAIN LAYER` | Move / collapse | True, but too implementation-facing for first-layer UI. |
| Repeated status chips across cards | Source card, memory panel, verification panel | State mirroring | Mixed | `OVERLOADED` | Simplify | The screen already has too many same-weight indicators; the repetition creates cognitive noise. |

The most important overload signal is not any one label. It is the aggregate: several full cards, each with title, summary, legend, meta chips, and technical body content, all presented at the same visual weight.

## 7. Information Hierarchy Problems

1. Preview is present, but it does not dominate enough.
2. The screen reads like three equally important columns instead of one dominant composition surface with supporting rails.
3. The verification rail is too dense and too tall to be treated as a first-layer operator panel.
4. The left memory panel competes with the source anchor instead of staying in the background.
5. The sidebar infra footer leaks operational telemetry into the same visual field as composition work.
6. The operator has to read too many chips before understanding the next action.
7. The same page identity is repeated in the header, source card, memory panel, and verification panel, which is correct for grounding but excessive for the first layer.

My inference from the code and CSS is that the repeated `SurfacePacket` chrome plus the three-column grid creates equal-weight cards, so the preview cannot win the hierarchy even though it is the semantic center of the workflow.

## 8. Recommended Primary Layer

The smallest correct first-layer split is:

- Keep visible:
  - page identity and title,
  - the preview canvas,
  - the change-intent composer,
  - one short blocker summary,
  - one clear review handoff action,
  - one compact source-editor CTA.
- Keep but de-emphasize:
  - sidebar navigation,
  - device toggles,
  - a very short recent-step strip,
  - one or two page-state chips.
- Collapse into a detail view:
  - session internals,
  - verification tables,
  - class results,
  - `Путь LLM`,
  - trace and request identifiers.

The correct model for this screen is `preview-first` with compact action support, not blocker-first and not action-first.

## 9. Recommended Collapsed / Moved Layer

Move these out of the primary visual layer:

- memory/session internals,
- all trace / request / provider / model details,
- the section projection table,
- class-level verification details,
- infra health telemetry,
- repeated same-weight status chips,
- any deep debug identifiers.

These do not need to disappear from the product. They need to stop occupying the operator's first read.

## 10. Smallest Safe UI Cleanup Direction

The smallest safe cleanup is not a redesign. It is a hierarchy correction:

1. Make preview visually dominant relative to the two support rails.
2. Collapse the memory panel and the detailed verification internals behind disclosure controls.
3. Reduce the number of visible chips in the source and verification cards.
4. Remove infra telemetry from the main workspace visual field or tuck it into a shell-only disclosure.
5. Keep the source-editor CTA and review handoff explicit, but compact.
6. Preserve the current route model and session model; this audit does not call for flow changes.

That would keep the product intact while making the screen feel like an operator workspace instead of an engineering console.

## 11. Overall Verdict

The landing workspace is functionally correct and directionally on canon, but the screen is currently `OVERLOADED`.

What is good:

- the page owner anchor is explicit,
- the preview is real and the interaction model is bounded,
- the source editor remains the truth-editing surface,
- review handoff is explicit and human-controlled,
- the UI copy is now largely Russian.

What is not yet good enough:

- preview does not dominate the screen,
- technical state is overexposed,
- the verification rail reads like a diagnostic panel,
- the sidebar telemetry leaks engineering data into the main workspace experience.

Bottom line: this is a solid operator workflow wrapped in too much first-layer information. It needs a simplification pass, not a product rewrite.
