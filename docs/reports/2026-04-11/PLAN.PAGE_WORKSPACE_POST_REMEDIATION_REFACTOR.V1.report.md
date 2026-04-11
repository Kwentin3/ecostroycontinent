# PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.V1.report

## 1. Executive Summary
Подготовлен bounded refactor plan для следующей волны page workspace после уже выполненного remediation epic. План сознательно не переоткрывает архитектуру: single-workflow model, `Page` ownership, metadata separation, AI assistive posture и canonical preview остаются неизменными.

Следующая волна нужна не из-за structural drift, а из-за трёх спокойных, но ещё не закрытых зон:
- archive path существует, но ещё не имеет полного live confirmation on eligible page;
- post-remediation legacy всё ещё смешивается в две разные категории, которые нужно разнести: historical data vs runtime compatibility;
- tablet preview technically correct, but operator-perceived value is still not clearly sufficient on sparse pages.

Рекомендованный следующий шаг: не новый большой epic, а bounded verification/inventory wave, после которой можно принять отдельный маленький implementation epic на tablet polish и, только если это реально нужно, targeted legacy cleanup.

## 2. Sources Used
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- `docs/implementation/PLAN.PAGE_WORKSPACE_REMEDIATION_REFACTOR.v1.md`
- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-11/PLAN.PAGE_WORKSPACE_REMEDIATION_REFACTOR.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`

Path discrepancy not found: all required documents were present under the expected locations.

## 3. Current Confirmed State
После remediation epic уже подтверждено:
- page workspace не падает на no-revision pages;
- mojibake in source defaults corrected, and known legacy literals are boundedly normalized;
- lifecycle actions are present in registry/workspace;
- AI panel is calmer and patch-only;
- preview remains canonical `StandalonePage`.

То есть базовая архитектурная работа завершена. Открытые хвосты теперь уже не architectural, а operator-quality and cleanup-quality.

## 4. Why a Bounded Next Wave Is Needed
Новая волна нужна потому, что текущие open items находятся на разных уровнях и их нельзя закрывать одной общей формулой “ещё cleanup”.

Есть три разных класса задач:
1. **Verification gap**: archive path already exists, but acceptance proof on a real eligible page is still incomplete.
2. **Legacy ambiguity gap**: historical data and runtime compatibility are both still present, but they require different cleanup strategies.
3. **UX polish gap**: tablet preview is not broken, but its practical operator value is still not convincingly proven.

Именно поэтому следующий шаг должен быть bounded refactor plan, а не новый redesign или docs sweep.

## 5. Legacy Decomposition Findings
### Legacy Data / Content
Это already persisted historical content, отклоняющийся от current canonical defaults.

Что сюда входит сейчас:
- old corrupted mojibake strings still tolerated by [page-copy.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/page-copy.js);
- any stored page copy not covered by the current known-literal map;
- old persisted payloads that need normalization on read.

Что уже закрыто:
- new defaults are fixed at source in [pure.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/pure.js);
- known literals are normalized in workspace and public/review rendering.

Что ещё не закрыто:
- actual inventory of historical persisted corruption;
- decision whether bounded tolerance is enough or a targeted backfill is needed.

### Legacy Code / Runtime
Это compatibility pieces, которые still exist to keep transition safe.

Что сюда входит сейчас:
- [workspace chooser redirect](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/workspace/landing/page.js)
- [workspace page redirect](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/workspace/landing/[pageId]/page.js)
- deprecated landing workspace API stub under `app/api/admin/workspace/landing/[pageId]/route.js`

Что уже закрыто:
- dead landing-workspace UI modules removed in earlier follow-up epic;
- top-level nav ownership drift removed.

Что ещё не закрыто:
- explicit sunset taxonomy for still-living compatibility bridges.

Главный вывод: legacy data cleanup и legacy runtime cleanup нельзя планировать как один общий cleanup epic. У них разные риски, разные evidence types и разные stop conditions.

## 6. Archive Verification Strategy
Current state after remediation:
- archive/deactivation logic implemented;
- routes/tests exist;
- UI affordance exists;
- live smoke on a truly eligible published page is still missing.

Recommended strategy:
1. create or identify one controlled published fixture page with active live publication and no policy blockers;
2. run operator-complete live smoke from registry/workspace;
3. verify post-archive state in registry, workspace and history;
4. pair this with one small route/policy review to confirm the smoke aligns with the permission model.

Recommended choice if current production dataset stays inconvenient:
- do not wait indefinitely for an accidental eligible page;
- use one controlled fixture page and archive it deliberately.

Why this is the right boundary:
- it proves the real operator path;
- it does not reopen lifecycle architecture;
- it gives deterministic acceptance evidence.

## 7. Tablet Preview Strategy
Current problem is practical, not architectural.

Observed decomposition:
- the renderer is already canonical and should stay unchanged;
- width presets alone may be insufficient on sparse pages;
- the operator likely needs stronger device affordance, clearer width semantics and slightly stronger preview framing.

Recommended narrow strategy:
- keep the current `PreviewViewport` abstraction;
- add clearer width semantics to the active preset or toolbar state;
- strengthen device framing/chrome just enough to make tablet mode feel intentional;
- validate on both a sparse page and a denser page before considering the problem closed.

What should not happen:
- no new preview subsystem;
- no split-screen compare tool;
- no QA lab.

## 8. Proposed Phased Plan
### Phase A — Archive verification / follow-through
- Type: smoke-first verification
- Purpose: turn archive path from “implemented” into “fully accepted”
- Output: verified operator flow and evidence package

### Phase B — Legacy taxonomy and cleanup strategy
- Type: inventory/report
- Purpose: split legacy into data vs runtime
- Output: actionable cleanup taxonomy instead of vague legacy narrative

### Phase C — Legacy data cleanup bounded plan
- Type: decision + optional targeted backfill plan
- Purpose: decide whether any historical persisted corruption still needs cleanup
- Output: finite target set or explicit decision to keep bounded tolerance only

### Phase D — Legacy code/runtime cleanup bounded plan
- Type: compatibility inventory and sunset planning
- Purpose: define when the remaining redirects/stubs can be removed
- Output: explicit keep/remove-later matrix

### Phase E — Tablet preview practical polish
- Type: bounded implementation epic
- Purpose: raise operator-perceived usefulness of tablet mode without redesign
- Output: small preview UX polish and live validation

## 9. Decision Recommendations
1. **Archive confirmation without convenient production page**  
   Recommended: use a controlled published fixture page.

2. **Legacy data cleanup boundary**  
   Recommended: inventory first, then only targeted migration for a finite known set if residual corruption is real.

3. **Legacy code cleanup boundary**  
   Recommended: keep compatibility bridges until explicit sunset evidence exists; do not remove them in the same wave as taxonomy.

4. **Definition of sufficiently good tablet preview**  
   Recommended: clear active device, explicit width semantics, and visible value on both sparse and denser page examples.

5. **Need for another live verification pass**  
   Recommended: yes. Archive follow-through and tablet usefulness are operator-facing and should be re-verified live.

## 10. Risks
- Archive verification may accidentally expand into lifecycle redesign if the team starts reopening broader delete/archive product semantics.
- Legacy data cleanup may drift into unsafe mass migration if inventory boundaries are skipped.
- Legacy runtime cleanup may remove still-needed compatibility too early.
- Tablet preview polish may drift into preview redesign.
- Even after technical changes, operator value may remain low if the real issue is content sparsity and not framing.

## 11. Suggested Next Implementation Step
Самый практичный следующий implementation prompt должен быть не “почистить всё legacy”, а узкий two-part epic:
1. archive follow-through verification on a controlled published page;
2. tablet preview practical polish inside current `PreviewViewport`, with live recheck on sparse and denser pages.

Legacy cleanup should start with taxonomy/inventory first, and only then split into targeted data cleanup or later compatibility sunset work.