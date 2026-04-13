# AUDIT.CLAIMED_VS_IMPLEMENTED.PAGE_WORKSPACE_UI_FEATURES.V1.report

## 1. Executive Summary
Overall verdict: **PARTIALLY ALIGNED**.

Page workspace as a whole is no longer a phantom feature. The unified page editor is real, multi-type foundation is real, metadata modal is real, preview is real, and page lifecycle actions are real. The main problem is not that the entire editor was "documented but nonexistent". The main problem is that the documentation and older execution reports now describe several different generations of the screen at once.

That creates three kinds of operator risk:
- some things are truly implemented, but hidden deeper than operators expect;
- some things were implemented in an earlier page-workspace wave, but are no longer surfaced in the current unified foundation UI;
- some reports still read like certain UX affordances are current, while code and live UI only provide a narrower or different version.

The clearest example is page theme/color handling. A real page theme feature exists today, but only as `pageThemeKey` inside the metadata modal. It is not visible in the main workspace, not surfaced as an obvious visual-control affordance, and the old report wording about a changing header theme badge no longer matches the current unified workspace. So this is not a pure missing feature. It is a mix of **hidden discoverability + partial visual-control scope + outdated report wording**.

The most dangerous mismatch today is the AI cluster. Older remediation reports explicitly describe a visible bounded AI patch flow in page workspace, but the current `PageWorkspaceScreen` no longer renders an operator AI panel at all. The backend `suggest_patch` path and helper model still exist, but the operator surface does not. That makes old execution reports materially stronger than current reality.

## 2. Source Docs Used
### Product / canon
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/product-ux/DECISION.UNIFIED_PAGE_WORKSPACE_MULTITYPE_OWNER_MODEL.v1.md`

### Planning / implementation
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- `docs/implementation/PLAN.PAGE_WORKSPACE_REMEDIATION_REFACTOR.v1.md`
- `docs/implementation/PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.v1.md`
- `docs/implementation/PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.v1.md`
- `docs/implementation/PLAN.EXECUTION_READY.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1.md`

### Execution / audit reports
- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.ANAMNESIS.EQUIPMENT_SERVICE_LANDING_UI.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.SEO_OPERATOR.VARIANT_B_LANDING_OWNER_MODEL.V1.report.md`
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1.report.md`
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_OVERFLOW_FIX.V1.report.md`

### Path discrepancy noted
The prompt referenced:
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_OVERFLOW_FIX.V1.report.md`

Actual file in repo:
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_OVERFLOW_FIX.V1.report.md`

Best available source was used.

## 3. Audit Method
The audit was done on three layers and then cross-compared.

### 3.1 Documentation claim pass
I extracted explicit or implied claims about page workspace features from canon, plans, audits, and execution reports. I separated:
- actual canon statements;
- plan-only future statements;
- execution reports that speak in a present-tense "implemented and verified" voice.

### 3.2 Code inspection pass
I inspected the actual implementation zones named in the prompt and nearby runtime seams:
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageMetadataModal.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PreviewViewport.js`
- `components/public/PublicRenderers.js`
- `lib/admin/page-workspace.js`
- `lib/content-core/schemas.js`
- `lib/content-core/pure.js`
- `lib/landing-composition/visual-semantics.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/admin/(console)/workspace/landing/[pageId]/page.js`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`

### 3.3 Live UI verification pass
I verified the live UI on `https://ecostroycontinent.ru` using real login and representative page routes.

Verified routes:
- page registry: `/admin/entities/page`
- `equipment_landing`: `/admin/entities/page/entity_dd7222fd-c8cc-43e7-a559-543118ef2eb2`
- `service_landing`: `/admin/entities/page/entity_cbc06af9-f492-4c2e-a772-371f444cce58`
- `about`: `/admin/entities/page/entity_ce701af1-27dd-4bd6-9495-03868d7d5089`

What was verified live:
- registry opens;
- create flow opens;
- workspace opens for multiple page types;
- metadata modal opens;
- preview renders shell;
- lifecycle button exists;
- current workspace does not show an AI operator panel;
- metadata modal contains theme control and route/SEO tabs.

Important limitation:
- I did **not** save theme changes on a production page during this audit, so preview theme impact was verified via code path and current wiring, not by mutating live content just for proof.

## 4. Claimed Feature Inventory
Below is the practical claimed inventory that mattered for this audit.

### Core workspace and one-editor claims
Claimed strongly and currently true in code direction:
- one canonical page editor surface;
- no second competing landing editor;
- metadata remains a separate management layer;
- preview should be shell-faithful;
- page types should include `about`, `contacts`, `service_landing`, `equipment_landing`.

### Theme / visual control claims
Claimed in older audit language:
- theme control exists;
- theme selector switches;
- header badge with theme label changes;
- preview reflects metadata theme changes.

### Metadata claims
Claimed across refactor and execution docs:
- tabbed metadata modal exists;
- route/type/SEO fields moved out of the center canvas;
- modal remains separate from daily composition flow.

### Source panel claims
Claimed across remediation and foundation docs:
- source panel is a real operator zone;
- source families exist and vary by page type;
- empty states are usable and explanatory;
- `equipment` is a real first-class source in the unified model.

### Preview claims
Claimed across old and new docs:
- preview uses canonical renderer or same shell direction as public page;
- device modes are meaningful;
- readiness stays near preview;
- preview reflects page composition and theme.

### Lifecycle claims
Claimed strongly:
- review handoff remains page-owned;
- delete/archive exist with bounded policy;
- archive was later claimed as fully proven through real flow.

### AI claims
Claimed in older remediation docs/reports:
- visible AI panel exists in page workspace;
- AI bounded patch flow is live and verified;
- target semantics and progress/result feedback are operator-visible.

Claimed in newer unified-foundation docs/reports:
- AI section assistance is deferred from foundation;
- AI stays secondary and should not compensate for weak domain model.

That split is one of the central mismatches of the current doc layer.

## 5. Verified Implementation State
### 5.1 What is clearly implemented in code
Implemented and live-backed by code:
- multi-type page taxonomy: `about`, `contacts`, `service_landing`, `equipment_landing`;
- page-type-specific required section grammar;
- source refs for `primaryServiceId`, `primaryEquipmentId`, `caseIds`, `galleryIds`;
- page-level geo targeting;
- metadata modal with tabs `Основное / Маршрут / SEO`;
- page-level theme key via `pageThemeKey`;
- shell preview via `StandalonePage` + `PublicPageShell`;
- lifecycle actions with conditional availability;
- legacy landing route redirect back into page workspace.

### 5.2 What is implemented in code but narrower than some docs imply
Implemented, but narrower in real operator surface:
- visual control is only page-level theme in metadata modal, not a broader color/accent toolbox;
- readiness inside workspace is compact and basic, not a rich page-type diagnostics surface;
- source panel is real, but empty-state guidance is much thinner than some earlier reports suggest;
- AI backend/helper seams remain, but there is no visible AI panel in current `PageWorkspaceScreen`.

### 5.3 What is clearly still only planned or later-wave
Still planned or deferred, not current operator feature:
- inherited / changed manually / source changed UX;
- duplicate guardrails for serial production;
- rich source drift visibility;
- separate `geo_service_landing` type;
- richer proof/benefits/FAQ section families;
- section-scoped AI assistance inside current unified page workspace.

## 6. Verified Live UI State
### Registry
Live registry is real and usable as a start point.

Verified live:
- page registry opens;
- create button exists;
- type filter exists;
- page cards open into page workspace.

Discoverability note:
- metadata and lifecycle actions are not first-layer buttons on the registry card face; they live in the three-dots menu. That is acceptable, but it means some claims feel more obvious in docs than in first glance UI.

### Workspace
Live workspace is real for multiple page types.

Verified live:
- `equipment_landing` page opens in unified page workspace;
- `service_landing` page opens in the same surface;
- `about` page opens in the same surface;
- source panel, center canvas, and preview rail are all present.

Page-type differentiation verified live:
- `equipment_landing` shows `Основная техника` and equipment sections;
- `service_landing` shows `Основная услуга` and service sections;
- `about` does not expose service/equipment primary-source selectors.

### Metadata modal
Verified live:
- modal opens from workspace;
- tabs `Основное / Маршрут / SEO` are present;
- `Тема страницы` exists in `Основное`;
- `Slug`, `Тип страницы`, `Канонический интент` exist in `Маршрут`;
- `Индексация`, OG title and OG description exist in `SEO`.

### Preview
Verified live:
- preview is present in the same workspace;
- preview includes public shell label and renders with header/body/footer posture;
- device modes are visible as `Компьютер / Планшет / Телефон`;
- readiness sits beside preview.

### Lifecycle
Verified live:
- `Жизненный цикл` button exists in workspace;
- on the checked `equipment_landing` page, delete was available and archive was not.

Interpretation:
- this is **conditioned availability**, not evidence that archive is missing. Code and docs show archive is only present when policy and state allow it.

### AI
Verified live:
- no visible AI panel or AI action controls were present in current unified page workspace.

## 7. Claimed-vs-Implemented Gaps
### MATRIX 1 — Claimed vs implemented
| Feature | Claimed in docs/report | Actual code state | Live UI state | Gap type | Severity | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Page theme / color control | Older audit says theme selector works, header theme badge changes, preview reflects metadata theme changes | `pageThemeKey` is real in schema, metadata modal, save path, and preview renderer | Theme control exists only in metadata modal; no visible theme badge in workspace header | Hidden / low discoverability + Misleading docs/report wording | High | Real feature exists, but narrower and harder to find than old wording suggests |
| Broader visual accents | Topic was discussed as if visual tuning exists | Only page theme is surfaced; legacy visual semantics infra exists below, but not in unified workspace UI | Operator cannot find accent controls in workspace | Partial implementation | Medium | Not a full missing feature, but visual-control scope is much smaller than the discussion history suggests |
| Metadata modal tabs and fields | Strongly claimed | Implemented | Present and usable | Mostly aligned | Low | Baseline is real |
| Metadata richness | Some canon/PRD language can imply richer preview-adjacent metadata behavior | Modal covers route + SEO + OG basics only | Professionally usable baseline, but not rich | Acceptable later-wave item | Low | Not a breach, just keep wording modest |
| Source panel as real operator zone | Strongly claimed | Implemented | Present and central in live UI | Mostly aligned | Low | Layout guardrails and live UI confirm this |
| Explanatory empty source picker states with next-step links | Older remediation execution report claimed usable empty source pickers with links | Current `SourceChecklist` empty state is generic `Пока нет доступных записей.` | Depends on current data, but no richer empty-state logic exists in current component | Misleading docs/report wording | Medium | Likely true for older wave, not current unified workspace |
| Equipment as first-class page source | Foundation docs claim it is real | Implemented in schema, source refs, create flow, workspace, preview | Present in live `equipment_landing` | Mostly aligned | Low | Real current feature |
| Shell-faithful preview | Strongly claimed | Implemented through `StandalonePage` + `PublicPageShell` | Present in live UI | Mostly aligned | Low | One of the better aligned areas |
| Preview device modes | Claimed as meaningful | Implemented as `Компьютер / Планшет / Телефон` | Present in live UI | Mostly aligned | Low | Current labels differ from some older wording, but feature is real |
| Theme impact in preview | Older audit states it as fact | Code wiring supports it | Not re-saved on production page during audit | Conditioned availability only | Medium | Avoided mutating live page only for audit proof |
| Review handoff | Claimed | Implemented | Review link visible and route exists | Mostly aligned | Low | Real current feature |
| Archive/delete lifecycle | Claimed | Implemented with policy gates | Visible conditionally in UI | Conditioned availability only | Medium | Must not be audited as missing when state disallows it |
| AI bounded patch flow in page workspace | Older remediation report claims live AI bounded patch flow | Backend/helper seams still exist, but `PageWorkspaceScreen` no longer renders AI controls | No AI panel in live workspace | Partial implementation + Misleading docs/report wording | Critical | Biggest current claimed-vs-implemented mismatch |
| Multi-type foundation | Claimed in latest foundation docs/reports | Implemented | Live `about`, `service_landing`, `equipment_landing` routes confirm it | Mostly aligned | Low | Core foundation is real |
| Inherited / overridden / outdated UX | Frequently discussed in plans | Not implemented in workspace UI | Not visible in live UI | Acceptable later-wave item | Medium | Must not be spoken about as current feature |

## 8. Discoverability Analysis
### MATRIX 2 — Operator discoverability
| Feature | Where operator expects it | Where it actually lives | Easy to find? | Usable? | Notes |
| --- | --- | --- | --- | --- | --- |
| Theme / visual control | Many operators expect it in main workspace or preview rail | Metadata modal -> `Основное` | No | Yes | Hidden, and theme option labels are still English |
| SEO route fields | Operator may expect slug and canonical intent somewhere near page title | Metadata modal -> `Маршрут` | Medium | Yes | Fine once the modal is opened |
| Social/SEO fields | Operator may expect them in same metadata layer | Metadata modal -> `SEO` | Medium | Yes | Discoverable enough via tabs |
| Page type | Operator expects it at page header and create flow | Header badge, metadata modal, create flow | Yes | Yes | Good current visibility |
| Primary source binding | Operator expects it in left source panel | Left source column | Yes | Yes | Good alignment for service/equipment pages |
| Cases / galleries | Operator expects source panel or separate picker | Left source column checklists | Yes | Yes | Good enough |
| Lifecycle actions | Operator expects header action or menu | Workspace header menu and registry three-dots | Medium | Yes | State-conditioned, not always present |
| Preview device modes | Operator expects right preview rail | Preview toolbar | Yes | Yes | Labels are clear in Russian |
| AI help | Older reports make operator expect a right-side AI rail | Nowhere in current workspace UI | No | No | Docs/history can send operator on a false search |

### Top discoverability problems
1. Theme control is real but hidden in metadata modal and not surfaced as a visual-tuning affordance.
2. Theme option labels are English, which weakens the Russian first-layer posture.
3. Registry actions like metadata/lifecycle are usable, but not immediate on first glance because they live behind the three-dots menu.
4. Earlier docs make operators expect a visible AI panel that is no longer present.
5. Source empty states are thinner than earlier reports imply, so operators can still hit a "why is this empty?" moment without enough in-UI help.

## 9. Theme/Color Deep Dive
### 9.1 What was claimed
The strongest historical claim lives in `AUDIT.PAGE_WORKSPACE.FULL.V1.md`:
- theme control exists in metadata modal;
- theme selector switches;
- header badge with theme label changes;
- preview reflects metadata theme changes.

### 9.2 What the code currently says
Current code clearly supports page-level theme, but only page-level theme:
- `lib/content-core/schemas.js` includes `pageThemeKey` in `pageSchema`;
- `lib/admin/page-workspace.js` carries `pageThemeKey` through metadata state;
- `components/admin/PageMetadataModal.js` renders `Тема страницы`;
- `components/public/PublicRenderers.js` applies `page.pageThemeKey` to the rendered page class.

But current code does **not** support the stronger reading that operators now have an obvious full visual-control layer:
- there is no visible theme badge in `PageWorkspaceScreen` header;
- there is no color picker;
- there is no separate accent control in the workspace UI;
- per-block visual semantics exist only as lower-level infrastructure and legacy seams, not as current operator controls in unified page workspace.

### 9.3 What live UI says
Verified live:
- metadata modal contains `Тема страницы`;
- theme options are:
  - `Earth Sand`
  - `Forest Contrast`
  - `Slate Editorial`

This means:
- the feature is **not missing**;
- it is **hidden** from the main workspace;
- it is **partially surfaced**, because the only visible operator control is a theme dropdown in metadata;
- the first-layer Russian GUI baseline is **not fully respected** for theme option labels.

### 9.4 Theme verdict
Theme/color today should be classified as:
- **real current page-theme feature**;
- **low discoverability**;
- **partial implementation** if the intended reading is broader color/accent control;
- **misleading docs/report wording** where old reports imply visible theme-badge feedback or stronger visual-control affordance than the current unified workspace actually provides.

Direct answer to the prompt’s theme question:
- **There is a real working page-theme feature right now.**
- It lives in `Метаданные -> Основное -> Тема страницы`.
- It is difficult to find because it is completely absent from the main workspace and preview chrome.
- Broader color/accent control is **not** meaningfully surfaced in the current operator UI.

## 10. Top Risks
1. Operators or future agents may trust older remediation reports and search for a visible AI panel that no longer exists in the current unified page workspace.
2. Theme support may be incorrectly described as "there is visual tuning" when the real operator affordance is only a hidden metadata dropdown.
3. Older report wording about source-picker clarity can hide the fact that current empty states are generic again.
4. Plans and execution reports can easily get conflated: inherited/outdated/drift model is heavily planned, but not current operator reality.
5. English theme option labels undermine the otherwise strong Russian first-layer GUI direction and make visual settings feel more technical than operator-friendly.

## 11. Recommended Next Fixes
### MATRIX 3 — Action recommendation
| Finding | Fix type | Needs code? | Needs docs alignment? | Needs UX copy/discoverability change? | Priority |
| --- | --- | --- | --- | --- | --- |
| Old docs/reports still imply visible AI panel in page workspace | Docs alignment | No | Yes | No | P0 |
| Theme exists but is too hidden | Discoverability | Maybe | Yes | Yes | P1 |
| Theme option labels are English | UX copy | Yes | No | Yes | P1 |
| Old report says theme header badge changes, but current workspace has no such badge | Docs alignment | No | Yes | No | P1 |
| Source empty states are generic while older report implies richer guidance | Either docs alignment or small UX polish | Maybe | Yes | Yes | P1 |
| Registry action discoverability is only medium | UX polish | Maybe | No | Yes | P2 |
| Create-mode wording drift between docs and implementation (`Клонировать и адаптировать` vs `Копия с адаптацией`, `Без привязки` vs `Отдельная страница`) | Docs alignment | No | Yes | No | P2 |
| Keyboard-close behavior for metadata modal was not confirmed and overlay blocked subsequent action in smoke | Interaction integrity check | Maybe | No | Maybe | P2 |

### Practical next-fix order
1. **Docs first**: weaken or update old remediation/execution wording around AI panel and rich source-picker states so older reports stop reading like current UI truth.
2. **Theme discoverability**: add one short cue in the workspace header or preview area pointing operators to `Метаданные` for theme/page-level visual settings.
3. **Theme labels**: rename theme options to Russian operator-facing labels.
4. **Source empty states**: either restore richer explanatory empty states with next-step guidance, or weaken the old report wording that claims they already exist in current workspace.
5. **Optional interaction polish**: verify and, if needed, fix metadata modal close behavior and post-modal action continuity.

### What needs code vs what needs docs vs what needs discoverability only
Needs code first:
- Russian theme option labels
- optional source-empty-state polish
- optional metadata-modal interaction polish

Needs docs/report alignment first:
- AI panel claims
- theme badge claim
- richer source-empty-state claim
- old wording that reads planned or previous-wave features as current unified reality

Can be improved mainly by discoverability/copy:
- a short hint that visual settings live in `Метаданные`
- a short header/preview-adjacent note if the team wants theme to be operator-findable without moving it into the main canvas

## 12. Verdict
**PARTIALLY ALIGNED**

Why not `MOSTLY ALIGNED`:
- too many older docs/reports still speak in a stronger present-tense than the current UI deserves, especially around AI and some UX polish claims;
- theme/color is real, but operator discovery is much worse than the historical wording suggests;
- source empty-state quality was previously claimed more strongly than the current `PageWorkspaceScreen` actually implements.

Why not `MISALIGNED`:
- the core unified page workspace is real;
- multi-type page foundation is real;
- metadata modal is real;
- shell preview is real;
- lifecycle actions are real and state-gated;
- source panel is real;
- no second editor drift is visible in runtime.

The product is not lying wholesale. It is closer to this:
- **foundation features are mostly real**;
- **some old report language is stale or too strong**;
- **several operator-facing capabilities are hidden or thinner than expected**.