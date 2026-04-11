# IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report

## 1. Executive Summary
Следующая bounded wave для page workspace реализована и доведена до продового контура. Работа закрыла три обязательных трека:
- archive follow-through;
- legacy follow-through с явным разделением на data/content vs code/runtime;
- tablet preview practical polish.

Главный результат: archive path теперь не только реализован в коде, но и подтверждён через реальный operator-flow на контролируемой опубликованной странице. Legacy больше не описывается одним расплывчатым словом: historical content и runtime compatibility разведены в отдельные инвентари с разными границами cleanup. Tablet preview остался внутри canonical `StandalonePage` preview, но стал заметно понятнее за счёт явной ширины, device state и более выразительного framing.

## 2. Source Docs Used
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- `docs/implementation/PLAN.PAGE_WORKSPACE_REMEDIATION_REFACTOR.v1.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`
- `docs/implementation/PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.v1.md`
- `docs/reports/2026-04-11/PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.V1.report.md`

Discrepancy check:
- required paths were present and used as-is.

## 3. Gating Decisions Taken
1. Archive follow-through fixture:
   - primary controlled fixture: page `тест`, id `entity_2c03180f-b0e4-44ab-acb6-96836d293dea`;
   - post-deploy confirmation fixture: page `тест повтор`, id `entity_fd32f441-70ab-401b-b4e1-8832aecf46be`.
   - Why: both are controlled admin-owned pages, safe for publish/deactivate verification without business-side risk.
2. Archive acceptance evidence:
   - chosen evidence = full operator path `workspace -> review -> owner approve -> publish -> workspace manage -> снять с live`, plus registry/public verification.
3. Legacy data/content cleanup boundary:
   - fix source defaults at origin;
   - keep bounded runtime normalization only for a finite known literal set;
   - no broad historical migration.
4. Legacy code/runtime cleanup boundary:
   - inventory and classification in this wave;
   - no blind removal of compatibility stubs without sunset evidence window.
5. Tablet preview improvement scope:
   - explicit width semantics;
   - clearer active device state;
   - stronger frame/chrome;
   - no new renderer and no compare lab.
6. Intentionally out of scope:
   - broad DB migration of historical copy;
   - removal of all landing-workspace compatibility bridges;
   - lifecycle redesign beyond bounded archive confirmation;
   - new preview subsystem.

## 4. What Was Implemented By Track

### Track A — Archive Follow-Through
- Used controlled fixture page `тест` to prove the full lifecycle path on a real live-eligible page.
- Re-ran the same operator path after deploy on `тест повтор` to confirm the shipped build, not only the local code.
- Added lightweight operator state cues already implemented in code:
  - `В live` badge in workspace for live-published pages.
  - `Сейчас в live` cue in registry records.
- Confirmed deactivation leaves history intact and only clears the active live pointer.

### Track B1 — Legacy Data / Content
- Formalized finite known-literal inventory through `KNOWN_LEGACY_PAGE_COPY_ENTRIES`.
- Added explicit collector `collectKnownLegacyPageCopyMatches()` so tolerated historical values are inspectable rather than hand-waved.
- Fixed source defaults in `lib/content-core/pure.js` so new payloads stop generating broken copy at the origin.
- Kept bounded normalization for already persisted known literals; did not run unsafe mass cleanup.

### Track B2 — Legacy Code / Runtime
- Produced explicit runtime compatibility inventory.
- Classified compatibility items as:
  - keep for now;
  - safe to remove now;
  - remove later after evidence window.
- Result in this wave:
  - no runtime compatibility piece was removed, because safety evidence for sunset is still insufficient;
  - sunset condition is now explicit instead of implicit.

### Track C — Tablet Preview Practical Polish
- Added `lib/admin/preview-viewport.js` as a single source of truth for viewport options and width semantics.
- Updated `PreviewViewport` to make device choice operator-visible:
  - active state block with label + width + hint;
  - width readout on every control;
  - stronger preview chrome and device pill.
- Preserved canonical preview reuse in workspace and review; no renderer split introduced.

## 5. Archive Verification Notes

### Controlled fixture and pre-state
Primary fixture:
- title: `тест`
- page id: `entity_2c03180f-b0e4-44ab-acb6-96836d293dea`
- rationale: controlled admin test page, safe for publication and deactivation
- public pre-check: `/about` returned `404`, so publish/deactivate verification would not collide with an existing live page

Post-deploy confirmation fixture:
- title: `тест повтор`
- page id: `entity_fd32f441-70ab-401b-b4e1-8832aecf46be`
- rationale: second controlled page used to verify the shipped build end-to-end

### Real operator path executed
For both fixtures, the path used was:
1. open page from registry into workspace;
2. `Передать на проверку`;
3. open review;
4. approve revision;
5. publish through the real publish readiness flow;
6. return to workspace;
7. open `Управление`;
8. `Снять с live`;
9. accept confirmation dialog.

This was a real operator flow. No direct route hacking or manual DB/state mutation was used.

### Post-state confirmed
For `тест` and again post-deploy for `тест повтор`:
- workspace moved from `В live` to `Вне live`;
- operator feedback appeared: `Объект снят с публикации.`;
- workspace explanatory copy changed to the historical inactive state;
- `Снять с live` action disappeared after deactivation;
- registry counters reflected the new inactive count;
- registry cards showed `Вне live`;
- public `/about` returned `404` after deactivation;
- history link remained available.

### Acceptance verdict for archive track
Archive path is now fully accepted as a real operator path.

## 6. Legacy Data Findings

### Explicit inventory
Known user-visible historical data/content patterns still tolerated:

| Pattern class | Current handling | User-visible? | Status |
| --- | --- | --- | --- |
| Known mojibake block titles / CTA labels from old defaults | normalized by `normalizeLegacyPageCopy()` | Yes | Covered |
| New payload defaults | generated from fixed canonical literals in `pure.js` | Yes | Closed at source |
| Unknown historical corrupted literals outside the known map | no broad automatic cleanup | Potentially | Not proven, boundedly deferred |

### Covered finite known set
The finite known set is explicitly stored in:
- `lib/content-core/page-copy.js`

It currently covers six known broken literals and their canonical readable replacements.

### Boundary chosen
- bounded tolerance is enough for now;
- no broad backfill was run;
- any future cleanup should target only concrete observed historical values, not do a mass rewrite.

### Verification
- targeted tests confirm the source defaults now produce readable copy;
- targeted tests confirm known literals are discoverable and normalizable;
- live workspace/review/public checks no longer surface the previously observed default CTA mojibake in current flows.

## 7. Legacy Runtime Findings

### Explicit runtime/code inventory

| Item | Category | Current purpose | Classification | Sunset condition |
| --- | --- | --- | --- | --- |
| `app/admin/(console)/workspace/landing/page.js` | redirect | keeps old chooser deep links from breaking | Keep for now | remove after evidence window shows no meaningful usage |
| `app/admin/(console)/workspace/landing/[pageId]/page.js` | redirect | keeps old workspace deep links from breaking | Keep for now | remove after evidence window shows no meaningful usage |
| `app/api/admin/workspace/landing/[pageId]/route.js` | deprecated API stub | explicit compatibility failure/redirect posture for old callers | Keep for now | remove only after compatibility consumers are proven absent |
| `lib/landing-workspace/landing.js` | compatibility helper still used by workspace route/reporting paths | Keep for now | remove only after page workspace stops depending on this branch |
| `lib/landing-workspace/session.js` | compatibility/session helper exercised by tests | Keep for now | remove only after dependent route logic is refactored away |

Safe to remove now:
- none proven in this wave.

Already removed in earlier wave:
- dead landing-workspace UI modules and peer-screen workflow surfaces.

### Why no further runtime cleanup was executed
The remaining runtime pieces still participate in safe compatibility or in current route logic. Removing them now would be speculative cleanup, not bounded remediation.

## 8. Tablet Preview Improvement Notes

### Improvements implemented
- explicit width readout for each viewport option;
- stronger active-state affordance in the viewport toolbar;
- operator-readable active device status block;
- device pill and width metadata inside frame chrome;
- shared viewport definitions via `lib/admin/preview-viewport.js`.

### Why this was chosen
The problem after remediation was not rendering correctness but operator-perceived usefulness. These changes raise comprehension without introducing a second preview model.

### Verification performed
Sparse page verification:
- `тест повтор`
- observed `Планшет` state with `834 px` readout and device-specific hint

Denser page verification:
- `entity_289fcd2b-6c55-4394-bd4e-713f7161e40f`
- observed the same tablet semantics and stronger framing on a more content-heavy page

### Bounded outcome
Tablet mode is now more legible and intentional, but still intentionally simple. No compare lab, no split-screen, no preview redesign.

## 9. Files / Code Zones Changed
- `components/admin/PageRegistryClient.js`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PreviewViewport.js`
- `components/admin/admin-ui.module.css`
- `lib/admin/preview-viewport.js`
- `lib/content-core/page-copy.js`
- `lib/content-core/pure.js`
- `tests/admin/page-workspace-remediation.test.js`
- `tests/admin/page-workspace-post-remediation-wave.test.js`

Documentation/report artifacts in this delivery:
- `docs/implementation/PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.v1.md`
- `docs/reports/2026-04-11/PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report.md`

## 10. Delivery Notes
- commit: `cab8f7c` `Execute page workspace post-remediation wave`
- build-and-publish run: `24279315377` success
- deploy-phase1 run: `24279352602` success
- deployed image:
  - `ghcr.io/kwentin3/ecostroycontinent-app@sha256:46cdf09595e1412bc244cf7b2a435d50151e54d07743ab217d3f9d85dee35394`

At the moment of writing this report, the code and the live verification evidence are on the deployed build. A final documentation commit is still required to include this report and the plan docs in Git history.

## 11. Tests / Checks Run

### Local targeted checks
- `node --test tests/admin/page-workspace-post-remediation-wave.test.js tests/admin/page-workspace-remediation.test.js tests/admin/live-deactivation.route.test.js tests/admin/live-deactivation.test.js tests/page-workspace.route.test.js tests/landing-workspace.route.test.js`

### Full local checks
- `npm test` -> passed `154/154`
- `npm run build` -> passed

Note:
- the existing Turbopack NFT warning around `next.config.mjs` remains pre-existing and was not introduced by this wave.

## 12. Post-Deploy Smoke Results

| Flow | Result | Evidence |
| --- | --- | --- |
| Registry open | Passed | `/admin/entities/page` opened successfully after deploy |
| Workspace open | Passed | published and non-published pages opened |
| No-revision page safe state | Passed | `entity_1f336176-c972-442b-9813-0ae559e63e40` showed honest empty state, no `500`, save/review disabled |
| Archive flow | Passed | `тест повтор` published then deactivated through workspace manage flow |
| Public route effect after archive | Passed | `/about` returned `404` after deactivation |
| Metadata open | Passed | metadata modal tabs `Основное / SEO / Маршрут` visible |
| AI unaffected | Passed | AI panel and target semantics remained visible in workspace |
| Tablet preview on sparse page | Passed | `Планшет`, `834 px`, device hint visible on `тест повтор` |
| Tablet preview on denser page | Passed | same semantics visible on `entity_289fcd2b-6c55-4394-bd4e-713f7161e40f` |

## 13. Plan Closure Matrix

| Planned concern | Planned phase/track | Implemented behavior | Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| Archive follow-through | Track A | real publish -> deactivate operator path confirmed on controlled fixtures | live Playwright smoke, registry/workspace/public post-state | Done | verified both pre-deploy and post-deploy |
| Legacy data/content clarification | Track B1 | finite known-literal inventory made explicit | `KNOWN_LEGACY_PAGE_COPY_ENTRIES`, collector test coverage | Done | legacy data no longer described vaguely |
| Legacy data cleanup if performed | Track B1 | source defaults fixed, bounded normalization retained, no broad migration | `pure.js`, `page-copy.js`, tests | Done | bounded by design |
| Legacy runtime/code clarification | Track B2 | runtime compatibility inventory and classification recorded | report inventory table + existing route/test evidence | Done | no speculative removal |
| Runtime cleanup if performed | Track B2 | none removed because safety evidence insufficient | route inventory and sunset conditions | Done | deliberate bounded decision |
| Tablet preview practical polish | Track C | viewport width semantics and stronger framing added | `PreviewViewport`, `preview-viewport.js`, live smoke on sparse + denser pages | Done | renderer architecture unchanged |

## 14. Requirements / Implementation Matrix

| Requirement / concern | Source | Expected behavior | Implemented result | Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `Страницы` remains single workflow domain | `PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md` | no return to dual-screen narrative | unchanged; all work stayed inside current registry/workspace | unchanged routes, smoke on `/admin/entities/page` and workspace | Done | preserved baseline |
| `Page` remains canonical owner | PRD + previous remediation plan | archive, preview and copy fixes must not create second owner | all changes remain page-owned and route-local | workspace flow, no new truth store, no new renderer | Done | preserved baseline |
| Archive path must be proven through real operator flow | `PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.v1.md` | archive no longer “implemented but unproven” | controlled fixture published and deactivated through UI | live smoke notes, registry/public state changes | Done | fully closed |
| Legacy must be split into data/content vs code/runtime | post-remediation plan | explicit taxonomy, not one vague bucket | separate inventories and cleanup boundaries recorded | Sections 6 and 7 of this report | Done | terminology now precise |
| Legacy data cleanup must stay bounded | post-remediation plan | no unsafe broad migration | source fix + finite tolerance map only | `pure.js`, `page-copy.js`, tests | Done | unknown historical values still explicitly deferred |
| Compatibility cleanup must not break safe redirects | post-remediation plan | keep runtime bridges until sunset evidence exists | no compatibility route removed prematurely | inventory table + existing route tests | Done | bounded restraint |
| Tablet preview should become practically useful | audit concern + post-remediation plan | operator should feel why tablet mode exists | explicit width semantics, device pill, active-state framing | live sparse/denser smoke + code changes | Done | still intentionally lightweight |
| Preview must stay canonical | PRD + previous remediation plan | no new preview subsystem | current `PreviewViewport` reused in workspace and review | code inspection + smoke | Done | preserved baseline |

## 15. Risks Found During Execution
- Archive verification can still become noisy if future teams use arbitrary business pages instead of controlled fixtures.
- Unknown historical corrupted payloads may still exist outside the finite known-literal set.
- Remaining landing-workspace compatibility code should not be called “dead” until a real sunset window is established.
- Tablet preview usefulness still depends somewhat on content density; the polish helps comprehension, not content richness.

## 16. What Was Deferred and Why
- Broad historical data migration:
  - deferred because the known operator-visible issue is already boundedly covered and a mass rewrite would be unsafe.
- Runtime compatibility removal:
  - deferred because remaining redirects/stubs still serve explicit transition safety and lack a proven sunset window.
- Additional lifecycle UX redesign:
  - deferred because archive acceptance is now proven; broader lifecycle design is outside this wave.

## 17. Remaining Open Questions
- Is there enough evidence window to start planning retirement of `/admin/workspace/landing*` compatibility paths, or should they survive one more bounded cycle?
- Do we want a small operator-facing note in the archive confirmation copy explaining that public route withdrawal has already happened, or is current feedback sufficient?
- Should future legacy-data work include an offline report command for persisted-copy inventory, or is current bounded tolerance enough until another real user-visible case appears?

## 18. Recommended Next Step
The next step should be a small evidence-driven cleanup epic, not a redesign:
1. decide whether the runtime compatibility sunset window has matured enough for `/admin/workspace/landing*` removal planning;
2. only if a new real user-visible corrupted payload appears, run a narrow targeted legacy data cleanup on a finite observed set.

