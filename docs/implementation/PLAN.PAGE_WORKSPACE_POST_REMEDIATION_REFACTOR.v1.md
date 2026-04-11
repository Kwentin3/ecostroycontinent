# PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.v1

Статус: proposed bounded refactor plan  
Дата: 2026-04-11  
Основание: post-remediation next wave for page workspace

## 1. Goal and Boundaries

Цель следующей волны - спокойно довести page workspace до более завершённого operator state без нового большого рефакторинга и без переоткрытия single-workflow architecture.

Эта волна ограничена тремя зонами:
- archive path verification and operator-complete lifecycle follow-through;
- systematic legacy clarification and cleanup strategy;
- practical tablet preview improvement.

### Hard boundaries
- Не переоткрывать домен `Страницы`, registry-first entry и unified page workspace.
- Не трогать `Page` ownership, metadata modal separation и AI assistive posture.
- Не строить новый preview subsystem.
- Не запускать broad data migration без жёсткой границы.
- Не смешивать legacy data cleanup и legacy runtime cleanup в одно неясное облако.

## 2. Why Architecture Should Stay Unchanged

Текущая архитектура после remediation уже решает главный structural problem:
- page workspace больше не конкурирует с отдельным AI screen;
- no-revision pages больше не падают;
- composition, metadata, AI и preview работают внутри одного page-owned workflow;
- lifecycle path уже появился как bounded domain action, а не как новая поверхность.

Оставшиеся вопросы теперь не требуют architectural reset. Они относятся к трём более узким слоям:
- недодоказанный operator path (`archive`);
- недоразобранный legacy хвост;
- недостаточно практичный preview polish на tablet.

## 3. Legacy Split: Data vs Code/Runtime

### 3.1 Legacy Data / Content

Это исторические значения, уже живущие в persisted content, которые отклоняются от текущего canonical content contract, но пока терпятся bounded normalization.

#### Что сейчас относится сюда
- already persisted mojibake strings в page block copy;
- старые page payload values, которые читаются через `normalizeLegacyPageCopy()` / `normalizeLegacyPagePayload()`;
- historical stored page copy, которая может отличаться от текущих canonical defaults even after source fix.

#### Что уже закрыто
- Source defaults исправлены в [pure.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/pure.js).
- Known corrupted literals покрыты bounded normalizer в [page-copy.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/page-copy.js).
- Workspace/review/public больше не показывают известный mojibake в новых и основных текущих flows.

#### Что ещё живёт
- Любые старые persisted значения, которых нет в текущем `LEGACY_PAGE_COPY_MAP`.
- Исторические page payloads с более широким corruption pattern, если они не совпадают с уже перечисленными literals.

#### Что реально dangerous
- Неразобранный historical payload, который still renders incorrectly и бьёт по доверию оператора.
- Возможность silently carry legacy data forever without inventory and without knowing its actual blast radius.

#### Что можно не трогать пока
- Любые старые значения, которые не всплывают в operator surface и не ломают current flows.
- Broad DB-wide rewrite without prior inventory.

#### Что требует отдельного cleanup strategy
- Targeted inventory of persisted corrupted literals.
- Decision between: keep bounded tolerance only, or do narrow targeted migration for a finite known set.

### 3.2 Legacy Code / Runtime

Это transitional code paths и compatibility pieces, которые не являются source of truth, но продолжают жить ради safe migration window или старых deep links.

#### Что сейчас относится сюда
- compatibility redirects:
  - [workspace chooser redirect](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/workspace/landing/page.js)
  - [workspace page redirect](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/workspace/landing/[pageId]/page.js)
- deprecated API stub:
  - [legacy landing workspace API](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/api/admin/workspace/landing/[pageId]/route.js)
- runtime branches that preserve compatibility with pre-single-workflow callers;
- bounded normalization branches kept only because historical content still exists.

#### Что уже закрыто
- Dead landing-workspace UI modules уже физически удалены в previous follow-up epic.
- Top-level nav and user-visible dual-screen narrative уже убраны.

#### Что ещё живёт
- Redirects and API stubs for old landing-workspace deep links.
- Compatibility logic in runtime that still exists only to avoid abrupt breakage.

#### Что реально dangerous
- Removing compatibility stubs too early and breaking old deep links or automation.
- Leaving compatibility routes forever without explicit sunset criteria.

#### Что можно не трогать пока
- Redirect-only pages/stubs, если они still carry safe bounded runtime function and do not confuse primary UX.

#### Что требует отдельного cleanup strategy
- Explicit compatibility inventory and sunset window.
- Narrow runtime cleanup plan after evidence that old paths are no longer used.

## 4. Archive Follow-Through Plan

### Current state
- Archive/deactivation logic exists.
- Route/tests exist.
- Operator-facing discoverability exists in registry/workspace.
- Live smoke on a truly eligible published page is still missing.

### Why next step is needed
Сейчас lifecycle architecture уже есть, но acceptance ещё неполная: operator path считается fully accepted only when a real eligible page can be archived safely and visibly through the live workflow.

### Exact verification path needed
1. Prepare or identify one controlled page with:
   - active published revision;
   - no policy blockers for deactivation;
   - safe operator ownership for smoke.
2. Open page from registry into workspace.
3. Confirm archive action is visible.
4. Trigger archive from workspace or registry.
5. Verify:
   - action succeeds;
   - operator sees explicit result feedback;
   - page disappears from live pointer state but keeps history;
   - registry signal/filters reflect new lifecycle state;
   - review/history links remain intact.
6. Optionally verify direct route/path fallback behavior once to confirm route contract and UI contract align.

### Safest way to confirm archive path
Recommended choice: create or use a controlled published fixture page in a bounded verification window, rather than wait for an arbitrary production page to become eligible.

#### Why
- It avoids broad lifecycle redesign.
- It gives deterministic acceptance evidence.
- It keeps the verification step honest: real published data, real live deactivation, real operator route.

### Is live smoke enough?
Recommended: live smoke plus one lightweight route/policy audit.

#### Why
- Smoke proves operator experience.
- Policy audit confirms the UI did not accidentally over-expose archive where policy should refuse it.
- The pair is enough; no new lifecycle epic is needed.

### If production dataset is not convenient
Recommended bounded follow-through:
- create one explicit controlled published fixture page;
- archive it once;
- record exact pre/post state;
- optionally keep it test-marked or immediately leave it inactive after verification.

### Acceptance criteria
- Archive action is visible on at least one eligible published page.
- Archive action succeeds in live workflow without direct route hacking.
- Page keeps history and no hard delete occurs.
- Registry/workspace feedback clearly reflects the new inactive state.
- Review/history invariants remain intact.

### Risks
- Verification effort may drift into redesign of lifecycle UX.
- Production fixture may be chosen poorly and carry unwanted business impact.
- Operator may still not understand archive semantics if confirmation/result copy is too thin.

### Bounded follow-through if smoke reveals issues
- If route/policy is correct but UX unclear: do a micro-polish only on confirmation/result copy.
- If eligible page selection is the only blocker: solve it with a controlled fixture, not with broader code change.

## 5. Tablet Preview Practical Improvement Plan

### Current state
- Device presets exist.
- Renderer posture is correct and canonical.
- Structural difference between presets exists in code.
- On sparse pages, operator-perceived difference between desktop and tablet can still be weak.

### Problem decomposition
This is likely a mixed issue, not a renderer issue.

#### 1. Width preset issue
Possible, but only partial. A width change alone may still feel weak when content is short and vertically simple.

#### 2. Preview framing issue
Yes. If preview chrome gives too little context, operator may not notice the semantic change in viewport mode.

#### 3. UI affordance issue
Yes. Labels alone (`Компьютер / Планшет / Телефон`) may not communicate concrete width or what to look for.

#### 4. Content density issue
Also yes. Sparse pages naturally expose less responsive difference, so operator value depends not only on code but on how the frame communicates change.

### Recommended bounded improvements
#### A. Stronger viewport semantics in the toolbar
- Add explicit width hint next to each preset or as current-state readout.
- Example posture: `Планшет · 834 px`.

#### B. Stronger frame affordance
- Slightly more visible tablet frame/chrome so the device mode feels intentionally different from desktop.
- Keep this purely visual; no new renderer.

#### C. Compact operator hint
- Add one short operator hint near preview toolbar, such as what tablet mode is mainly for: text wrap, CTA row break, source block stacking.
- Keep it one line, not a new training block.

#### D. Compare-oriented polish
- Keep single preview, but make the currently selected device state more legible via stronger active treatment.
- No split-screen compare tool.

### What must stay out of scope
- New preview subsystem.
- Multi-device side-by-side lab.
- Visual QA dashboard.
- Alternate non-canonical renderer.

### Acceptance criteria
- Operator can immediately see which width preset is active.
- Tablet mode communicates a meaningful difference even on moderately sparse pages.
- Preview remains canonical `StandalonePage`.
- No new preview architecture is introduced.

## 6. Proposed Phases

### Phase A — Archive verification / follow-through
**Goal**  
Fully accept archive path through one controlled operator-complete live verification.

**Why it matters**  
This closes the only remaining lifecycle evidence gap.

**Likely zones**
- live dataset / controlled fixture
- [workspace screen](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/PageWorkspaceScreen.js)
- [registry client](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/PageRegistryClient.js)
- [live deactivation route](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/api/admin/entities/[entityType]/[entityId]/live-deactivation/route.js)

**Out of scope**
- broader lifecycle redesign;
- new archive product surface.

**Acceptance criteria**
- One eligible published page archived successfully through live operator flow.
- Registry/workspace reflect inactive state correctly.

**Risks**
- fixture misuse;
- archive UX wording still unclear.

**Recommended delivery form**
- smoke-first;
- maybe micro-code polish only if smoke exposes a specific UX defect.

### Phase B — Legacy taxonomy and cleanup strategy
**Goal**  
Produce explicit inventory of post-remediation legacy data vs legacy code/runtime.

**Why it matters**  
Without this split, future cleanup drifts into vague “legacy cleanup” without bounded ownership.

**Likely zones**
- [page copy normalizer](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/page-copy.js)
- compatibility redirects/stubs under `app/admin/(console)/workspace/landing*` and `app/api/admin/workspace/landing*`

**Out of scope**
- broad cleanup in the same step.

**Acceptance criteria**
- Two explicit inventories exist: data legacy vs runtime legacy.
- Each entry is classified as keep / verify / deprecate / clean later.

**Risks**
- plan degenerates into vague prose instead of actionable inventory.

**Recommended delivery form**
- inventory/report first.

### Phase C — Legacy data cleanup bounded plan
**Goal**  
Decide whether bounded normalization is enough or whether a narrow targeted backfill is needed.

**Why it matters**  
This is the only remaining content-integrity uncertainty.

**Likely zones**
- stored page payload rows in SQL
- [page copy normalizer](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/page-copy.js)
- review/public rendering path

**Out of scope**
- broad content migration across unrelated entities.

**Acceptance criteria**
- Clear answer: keep bounded tolerance only, or run a targeted migration for a finite known set.
- If migration is chosen, the target literal set is fixed and auditable.

**Risks**
- unsafe mass rewrite of historical content.

**Recommended delivery form**
- inventory + decision note first;
- separate bounded implementation only if needed.

### Phase D — Legacy code/runtime cleanup bounded plan
**Goal**  
Prepare the safe sunset path for compatibility routes and runtime stubs.

**Why it matters**  
Runtime compatibility should be temporary and intentional, not immortal.

**Likely zones**
- [workspace chooser redirect](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/workspace/landing/page.js)
- [workspace page redirect](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/workspace/landing/[pageId]/page.js)
- [legacy landing workspace API](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/api/admin/workspace/landing/[pageId]/route.js)

**Out of scope**
- removing runtime bridges before safe window proof.

**Acceptance criteria**
- Each compatibility piece has explicit keep/remove condition.
- Dead vs still-needed compatibility is separated.

**Risks**
- removing still-used deep-link protection too early.

**Recommended delivery form**
- inventory + sunset criteria;
- separate cleanup epic later.

### Phase E — Tablet preview practical polish
**Goal**  
Make tablet preview more obviously useful to the operator without touching preview architecture.

**Why it matters**  
The problem is not correctness now, but practical operator value.

**Likely zones**
- [PreviewViewport](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/PreviewViewport.js)
- [shared preview styles](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/admin/admin-ui.module.css)

**Out of scope**
- new renderer;
- compare lab;
- QA dashboard.

**Acceptance criteria**
- Active device is more legible.
- Tablet mode communicates clearer operator value.
- Canonical renderer stays unchanged.

**Risks**
- polish may still underperform if the real issue is sparse content only.

**Recommended delivery form**
- bounded UI polish + live smoke on sparse and denser pages.

## 7. Decision Points

### Decision 1 — How to confirm archive path if production dataset has no convenient page?
**Decision needed**  
Wait for a real business page vs create/use a controlled published fixture.

**Recommended choice**  
Use a controlled published fixture page.

**Why**  
It is the smallest deterministic path to full acceptance evidence.

### Decision 2 — Where to draw the line for legacy data cleanup?
**Decision needed**  
Only known literals vs all historical corrupted payloads vs targeted migration.

**Recommended choice**  
Start with inventory of persisted values and only then choose targeted migration for a finite known set, if real residual corruption exists.

**Why**  
This avoids turning cleanup into unsafe mass migration.

### Decision 3 — Where to draw the line for legacy code/runtime cleanup?
**Decision needed**  
Only dead unused code vs compatibility stubs too.

**Recommended choice**  
Keep active compatibility stubs until explicit sunset evidence exists; clean dead code sooner, compatibility later.

**Why**  
The risk of early removal is higher than the cost of one more bounded compatibility wave.

### Decision 4 — What counts as “good enough” tablet preview?
**Decision needed**  
Pure width preset change vs stronger operator affordance.

**Recommended choice**  
Treat “good enough” as: clear active device, explicit width semantics, and noticeably different frame behavior on at least one sparse and one denser page.

**Why**  
The operator needs perceived usefulness, not just technical existence.

### Decision 5 — Is another live verification pass required after this wave?
**Decision needed**  
Can local proof suffice?

**Recommended choice**  
Yes, a live verification pass is required.

**Why**  
Archive follow-through and tablet preview usefulness are operator-facing concerns and should be proven in real WebGUI conditions.

## 8. Acceptance Criteria Matrix

| Concern | Current state | Target state | Required action | Evidence needed | Status after planned work |
| --- | --- | --- | --- | --- | --- |
| Archive action exists but is not live-confirmed | Logic and UI exist, but no eligible production smoke page was available | Archive path is fully accepted as real operator flow | Controlled live verification with eligible published page | live smoke + route/policy confirmation | Expected Done |
| Legacy data normalization is bounded but not broad | Known literals normalized, unknown historical corruption not inventoried | Clear boundary between tolerated historical data and cleanup candidate set | inventory first, then targeted decision | SQL/content inventory + decision note | Expected Done |
| Legacy code/runtime cleanup is not yet clearly split | Compatibility stubs exist, but no explicit sunset taxonomy for next wave | Every runtime bridge is classified as keep / verify / remove later | compatibility inventory and sunset criteria | inventory/report | Expected Done |
| Tablet preview is improved structurally but not yet clearly operator-sufficient | Presets exist, but tablet usefulness is partly disputed on sparse pages | Tablet mode gives clearer operator signal without preview redesign | bounded preview polish + live operator smoke | live smoke on sparse and denser pages | Expected Done/Partial depending on operator value |

## 9. Risks and Mitigations

| Risk | Severity | Trigger | Mitigation | Detection signal |
| --- | --- | --- | --- | --- |
| Archive confirmation effort expands into lifecycle redesign | High | team starts debating broader delete/archive product semantics | keep goal fixed: prove one existing path, not redesign lifecycle | PR/plan scope starts adding new lifecycle surfaces |
| Legacy data cleanup turns into unsafe mass migration | High | cleanup starts before inventory boundary is fixed | require explicit finite literal set before any backfill | migration touches broad historical content without exact target set |
| Legacy code cleanup removes still-needed compatibility | High | redirects/stubs removed before safe window proof | keep compatibility until explicit usage/no-usage decision | old deep links or tests start failing |
| Tablet preview polish drifts into preview redesign | Medium | proposal starts adding compare modes, extra renderers, labs | keep changes inside current `PreviewViewport` and styles | new preview routes/components/contracts appear |
| Operator value stays low because issue was content sparsity, not code | Medium | sparse pages still look similar across devices after polish | verify on sparse and denser pages; use width readout and frame affordance | operator still says tablet mode feels identical |
| Plan stays too abstract and does not lead to next epic | Medium | legacy/verification items remain unclassified | separate verification, inventory, and polish into explicit phases | next implementation prompt still has to rediscover basic seams |

## 10. Recommended Delivery Order

1. **Archive follow-through first**  
   Start with smoke/verification, not code. If the existing implementation already passes on a controlled published fixture, close the lifecycle evidence gap cheaply.

2. **Legacy taxonomy second**  
   Produce explicit split: legacy data vs legacy code/runtime. This prevents the next cleanup step from becoming amorphous.

3. **Legacy data decision third**  
   Only after inventory decide whether any targeted historical cleanup is justified.

4. **Legacy runtime cleanup planning fourth**  
   Keep it separate from data cleanup. Runtime bridges need sunset criteria, not blanket removal.

5. **Tablet preview polish last in the wave or parallel with taxonomy**  
   It is a bounded UX issue and can run in parallel with inventory work if desired, but should remain a small implementation epic.

### Practical grouping
- One verification/inventory mini-epic:
  - archive follow-through;
  - legacy split inventory.
- One bounded implementation mini-epic after that:
  - tablet preview polish;
  - targeted legacy cleanup only if inventory proves it is needed.

## 11. What Must Stay Out of Scope
- Any new page-workspace architecture rewrite.
- Any new page-builder capabilities.
- Any preview subsystem redesign or compare lab.
- Broad migration of all historical content without exact target set.
- Metadata-layer redesign.
- New docs sweep beyond the bounded plan/report for this next wave.