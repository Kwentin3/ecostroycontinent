# IMPLEMENTATION.EXECUTION.LEGACY_DATA_REMOVAL_AND_FINAL_TOPUP.V1

## 1. Executive Summary

Эта bounded wave закрыла cleanup/top-up задачу без переоткрытия архитектуры. Вместо миграции исторического мусора был применён явный `Keep / Remove / Hold` подход:

- сохранён текущий рабочий контур `Страницы` и ценный `media domain`;
- удалены 12 junk/test/historical `Page` entities, которые больше не несли продуктовой ценности;
- снят remaining runtime tolerance для legacy corrupted page copy, чтобы мусор больше не маскировался в рантайме;
- runtime compatibility tails повторно проверены и оставлены только там, где ещё нет достаточных оснований для безопасного sunset;
- после cleanup registry и workspace остались рабочими, public/site и media surface не пострадали.

Изменения доставлены в Git и на сервер. Post-deploy smoke подтверждает, что операторский surface стал чище: реестр страниц пуст от junk-артефактов, media domain жив, public `/services` работает, create/open/delete page flow после cleanup остаётся здоровым.

## 2. Source Docs Used

- [PRD_Экостройконтинент_v0.3.1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/product-ux/PRD_Экостройконтинент_v0.3.1.md)
- [PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md)
- [PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md)
- [PLAN.PAGE_WORKSPACE_REMEDIATION_REFACTOR.v1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/implementation/PLAN.PAGE_WORKSPACE_REMEDIATION_REFACTOR.v1.md)
- [PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.v1.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/implementation/PLAN.PAGE_WORKSPACE_POST_REMEDIATION_REFACTOR.v1.md)
- [IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md)
- [IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report.md](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report.md)

Path discrepancies: none found during this wave.

## 3. Gating Decisions Taken

1. Historical page/content junk is removed, not migrated, when it has no operator or product value.
2. `media domain` is preserved as valuable by policy and by runtime evidence; no media cleanup is performed in this wave.
3. `legacy data/content` and `legacy code/runtime` are treated as different buckets and reported separately.
4. Runtime compatibility bridges are only removed when there is explicit safety evidence. In this wave, the `/admin/workspace/landing*` compatibility family stays on `Hold`.
5. Runtime tolerance for legacy mojibake literals is safe to remove now because:
   - source defaults were already fixed in the prior remediation wave;
   - the remaining junk page entities were explicitly deleted in this wave;
   - continuing to tolerate corrupted literals would keep obsolete content semantics alive unnecessarily.

## 4. Keep / Remove / Hold Method

Classification method used in this wave:

- `Keep`: current valid operator/public content, current single-workflow runtime, and all media-domain value.
- `Remove`: finite, explicitly inventoried junk/test/historical page entities and obsolete runtime tolerance that only existed to mask removed historical corruption.
- `Hold`: ambiguous or still-necessary compatibility/runtime items with no safe sunset evidence yet.

Decision rule:

- If the item is required by current operator/public/media value, keep it.
- If the item is historical junk with no business value and no blocking references, remove it.
- If the item may still protect supported runtime paths or lacks evidence, hold it with an explicit sunset condition.

## 5. What Was Removed

### 5.1 Historical data/content removed

Twelve junk/test/historical `Page` entities were deleted through the real cleanup wrapper on the deployed runtime:

- `entity_fc13a2b2-5936-4db7-b0c8-2ae6c3b18bba` — `audit recover 1775828016757`
- `entity_b9945d80-47ed-459d-a24f-8efb413e3779` — `audit recover 1775827966049`
- `entity_1f336176-c972-442b-9813-0ae559e63e40` — blank no-revision page
- `entity_dc2bb4ef-4e52-4c2c-9bc3-2dbda9e73dcd` — blank no-revision page
- `entity_b7499a66-8e42-42b9-bcfe-a6b9df2fb9d9` — blank no-revision page
- `entity_e883c85a-c83d-4f55-a756-3d6b02f2d57f` — blank no-revision page
- `entity_a4e36af2-ceb0-4a70-a16b-86423681aefb` — blank no-revision page
- `entity_bff259aa-d132-4dec-a41e-db02fef3b7a7` — blank no-revision page
- `entity_fd32f441-70ab-401b-b4e1-8832aecf46be` — `тест повтор`
- `entity_2c03180f-b0e4-44ab-acb6-96836d293dea` — `тест`
- `entity_289fcd2b-6c55-4394-bd4e-713f7161e40f` — `audit happy 1775827966049`
- `entity_5448e2f7-377d-4b31-9fcf-f6dfeb9b6c19` — `audit happy 1775828016757`

All twelve were verified in a dry-run first and then removed with `blockingReferences: []`.

### 5.2 Runtime/data tolerance removed

The remaining legacy corrupted-page-copy tolerance was removed from runtime:

- deleted [page-copy.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/page-copy.js)
- removed dependent branches from:
  - [pure.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/pure.js)
  - [page-workspace.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/page-workspace.js)
  - [PublicRenderers.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/public/PublicRenderers.js)

This was a bounded removal, not a broad migration.

## 6. What Was Preserved

### 6.1 Media domain preserved

`media domain` was intentionally preserved as valuable:

- no media entities were targeted by cleanup;
- no media storage objects were deleted;
- post-deploy admin smoke confirmed [media_asset registry](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/app/admin/(console)/entities/[entityType]/page.js) still opens as `Медиатека`;
- operator actions `Загрузить` and `Коллекции` are still visible;
- cleanup runtime reported `storageResults: []`, confirming this wave did not touch stored media assets.

### 6.2 Surviving valid product/runtime surfaces preserved

- single-workflow `Страницы` registry and workspace remain intact;
- create/open/delete operator flow still works after cleanup;
- public `/services` remains healthy;
- existing preview, metadata, AI posture, and review/publish semantics for surviving valid entities remain unchanged.

## 7. Runtime Compatibility Review

Runtime compatibility was reviewed as a distinct track from historical data/content.

### 7.1 Reviewed compatibility items

| Item | Type | Decision | Reason | Sunset condition |
| --- | --- | --- | --- | --- |
| `/admin/workspace/landing` chooser redirect | runtime compatibility | Keep for now | old deep links may still exist; safe redirect posture already bounded | remove after evidence window shows no meaningful usage |
| `/admin/workspace/landing/[pageId]` workspace redirect | runtime compatibility | Keep for now | protects old direct links into the deprecated workspace family | remove after evidence window shows no meaningful usage |
| `/api/admin/workspace/landing/[pageId]` deprecated API stub | runtime compatibility | Keep for now | explicit compatibility failure/redirect path is safer than abrupt disappearance | remove after callers are proven absent |
| `lib/landing-workspace/landing.js` compatibility helper branch | runtime compatibility | Keep for now | still imported by current page workspace API path | remove only after dependency is fully cut |
| `lib/landing-workspace/session.js` compatibility/session helper | runtime compatibility | Keep for now | still part of the surviving compatibility surface | remove only after compatibility family is sunset |

### 7.2 Safe runtime removal performed now

Only one runtime class was clearly safe to remove now:

- the legacy corrupted-copy tolerance branch and helper file described in section 5.2.

No broader compatibility bridge was removed in this wave because sunset evidence is still insufficient.

## 8. Files / Code Zones Changed

Code/data cleanup wave:

- [PublicRenderers.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/components/public/PublicRenderers.js)
- [page-workspace.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/admin/page-workspace.js)
- [pure.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/pure.js)
- deleted [page-copy.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/content-core/page-copy.js)
- [test-data-cleanup.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/lib/internal/test-data-cleanup.js)
- [cleanup-test-data.mjs](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/scripts/cleanup-test-data.mjs)
- [page-workspace-post-remediation-wave.test.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/tests/admin/page-workspace-post-remediation-wave.test.js)
- [page-workspace-remediation.test.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/tests/admin/page-workspace-remediation.test.js)
- [test-data-cleanup.test.js](d:/Users/Roman/Desktop/Проекты/сайт%20Армен/tests/test-data-cleanup.test.js)

Operational cleanup executed on runtime:

- `/opt/ecostroycontinent/repo/scripts/cleanup-test-data-runtime.sh`

Documentation:

- this report file

## 9. Delivery Notes

- code commit: `5b317af` `Remove legacy page junk tolerance and extend cleanup inventory`
- server repo synced to `5b317af` before runtime cleanup
- docs/report commit created after this report is added
- code push completed before runtime cleanup
- deploy completed successfully before live cleanup and smoke verification

Build/deploy artifacts:

- build run `24280099914` — `success`
- deploy run `24280134103` — `success`
- deployed image `ghcr.io/kwentin3/ecostroycontinent-app@sha256:f5b4a661a06336efc1193bd4938308d38554f18ffb875ca680c52c04a97449ac`

## 10. Tests / Checks Run

### 10.1 Local checks

- targeted tests:

```powershell
node --experimental-specifier-resolution=node --test `
  tests/test-data-cleanup.test.js `
  tests/admin/page-workspace-remediation.test.js `
  tests/admin/page-workspace-post-remediation-wave.test.js `
  tests/page-workspace.route.test.js `
  tests/admin/live-deactivation.route.test.js `
  tests/admin/live-deactivation.test.js
```

Result: `33/33` passed.

- full test suite:

```powershell
npm test
```

Result: `155/155` passed.

- production build:

```powershell
npm run build
```

Result: passed. Existing Turbopack NFT warning around `next.config.mjs` remains pre-existing.

### 10.2 Runtime cleanup verification

Dry-run:

```sh
sh /opt/ecostroycontinent/repo/scripts/cleanup-test-data-runtime.sh --dry-run --json --entity-type page --exact-entity-ids ...
```

Result:

- `candidateCount: 12`
- `blockingReferences: []`

Actual cleanup:

```sh
sh /opt/ecostroycontinent/repo/scripts/cleanup-test-data-runtime.sh --confirm --json --entity-type page --exact-entity-ids ...
```

Result:

- all 12 target entities deleted
- `blockingReferences: []`

## 11. Post-Deploy Smoke Results

### 11.1 Registry clean after cleanup

Live URL:

- `https://ecostroycontinent.ru/admin/entities/page`

Observed:

- `Всего записей: 0`
- `Готово: 0`
- `Вне live: 0`
- `Новая страница`

### 11.2 Media domain intact

Live URL:

- `https://ecostroycontinent.ru/admin/entities/media_asset`

Observed:

- `Медиатека`
- `Загрузить`
- `Коллекции`

### 11.3 Public surviving content intact

Live URL:

- `https://ecostroycontinent.ru/services`

Observed:

- title `Экостройконтинент`
- `Публичный раздел`
- `Услуги`
- `Здесь показываются только опубликованные версии услуг.`

### 11.4 Operator surface still healthy after cleanup

Smoke page created and removed through real operator flow:

- created page title: `cleanup smoke page`
- opened resulting workspace:
  - `/admin/entities/page/entity_abc3e46e-fa2b-4660-aea0-8eed48373040`
- opened delete screen:
  - `/admin/entities/page/entity_abc3e46e-fa2b-4660-aea0-8eed48373040/delete`
- observed:
  - `Удаление разрешено`
  - `Собственных причин блокировки не найдено.`
- completed delete and returned to registry
- observed:
  - `Сущность удалена.`
  - `Всего записей: 0`

This confirms that registry, create, workspace open, delete, and final clean state all still work after cleanup.

## 12. Cleanup Closure Matrix

| Concern | Planned action | Implemented action | Evidence | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| historical data/content removal | inventory first, then bounded removal of valueless page junk | 12 explicitly inventoried junk/test/historical page entities deleted from runtime | dry-run `candidateCount: 12`, confirm cleanup result, live registry `Всего записей: 0` | Done | no broad migration performed |
| media preservation | preserve valuable media domain and avoid media deletion | no media entities or storage objects touched; media admin surface re-smoked live | live `Медиатека`, `Загрузить`, `Коллекции`; cleanup `storageResults: []` | Done | media treated as protected value |
| runtime compatibility review | re-check compatibility tails and classify keep/remove/hold | explicit runtime table produced; bridges kept where sunset evidence is insufficient | section 7.1 inventory | Done | no unsafe bridge deletion |
| runtime compatibility removal/keep decisions | remove only what is clearly safe now | removed corrupted-copy tolerance runtime; kept `/admin/workspace/landing*` family on Hold | code diff in section 5.2 and runtime table in 7.1 | Done | bounded removal only |
| operator-surface sanity after cleanup | verify registry/workspace/public/media remain healthy | page registry clean, media intact, public `/services` healthy, create/open/delete smoke successful | sections 11.1-11.4 | Done | confirms cleanup did not pollute operator surface |
| delivery/documentation closure | commit/push/deploy/report | code delivered, runtime cleanup executed on deployed contour, report added to repo | commit `5b317af`, build/deploy runs, this report | Done | docs commit follows this report |

## 13. Keep / Remove / Hold Matrix

| Item / class | Domain | Keep / Remove / Hold | Why | Evidence | Notes |
| --- | --- | --- | --- | --- | --- |
| current valid page/workspace runtime | current valid content | Keep | core operator flow still needed | live create/open/delete smoke | baseline must stay intact |
| current valid public service surface | current valid content | Keep | business-visible public content | live `/services` smoke | unaffected by cleanup |
| media assets / media registry / media actions | media domain | Keep | explicitly valuable domain | live media admin smoke; `storageResults: []` | protected by product decision |
| `audit recover*` pages | historical legacy content | Remove | test/audit artifacts with no business value | exact entity ids removed | finite, explicit cleanup |
| `audit happy*` pages | historical legacy content | Remove | test/audit artifacts with no business value | exact entity ids removed | finite, explicit cleanup |
| `тест` / `тест повтор` pages | test/junk content | Remove | operator test pages with no business value | exact entity ids removed | no need to migrate |
| blank no-revision junk pages | historical legacy content | Remove | empty transitional shells with no business value | exact entity ids removed | cleanup tool now supports no-revision entities |
| legacy corrupted-copy tolerance helper | runtime compatibility | Remove | no longer needed after source fix + junk removal | deleted `lib/content-core/page-copy.js` | bounded runtime simplification |
| `/admin/workspace/landing` redirect | runtime compatibility | Hold | safe redirect still protects unknown old links | file remains; runtime table | remove after evidence window |
| `/admin/workspace/landing/[pageId]` redirect | runtime compatibility | Hold | same as above | file remains; runtime table | remove after evidence window |
| `/api/admin/workspace/landing/[pageId]` deprecated stub | runtime compatibility | Hold | safer than abrupt disappearance without caller evidence | referenced in runtime inventory | remove after caller absence is proven |
| `lib/landing-workspace/landing.js` compatibility helper | runtime compatibility | Hold | still imported by current page workspace API path | current import path remains | requires later dependency cut |
| ambiguous non-page historical content not inspected in this wave | historical legacy content | Hold | no explicit evidence gathered in this bounded wave | out of current deletion target set | requires separate inventory if ever needed |

## 14. Risks Found During Execution

1. Removing no-revision junk pages required cleanup tooling to understand entities without revisions.
   Why it mattered:
   The old cleanup query joined only to `content_revisions`, which would have silently missed exactly the blank shells we wanted to remove.
   Mitigation:
   Cleanup inventory/query was upgraded first, dry-run was executed before confirm.

2. Removing runtime tolerance too early could have broken surviving valid pages if hidden corrupted literals still mattered.
   Why it mattered:
   This would have turned a cleanup wave into a regression.
   Mitigation:
   Source defaults had already been fixed in the prior wave, and junk pages were explicitly deleted before final tolerance removal.

3. Runtime compatibility bridge removal still lacks sunset evidence.
   Why it mattered:
   Blind deletion could break old deep links or forgotten callers.
   Mitigation:
   Those bridges remain on `Hold` with explicit sunset conditions instead of being force-removed now.

## 15. What Was Deferred and Why

- Broad historical data migration/backfill:
  intentionally deferred because this wave is about bounded removal, not mass repair.
- Runtime compatibility bridge removal for `/admin/workspace/landing*`:
  intentionally deferred because evidence is still insufficient for safe sunset.
- Wider inventory of non-page historical content:
  intentionally deferred because the current wave targeted the page/workspace contamination that directly affected the operator surface.

## 16. Remaining Open Questions

1. When will there be enough evidence to retire `/admin/workspace/landing*` compatibility bridges safely?
2. Is there any other non-page historical junk set worth inventorying next, or is operator-facing contamination now sufficiently reduced?
3. Do we want one final bounded telemetry/evidence window before planning runtime compatibility sunset?

## 17. Recommended Next Step

Do not open a new broad cleanup program immediately. The safest next step is:

1. keep the current system stable for an evidence window;
2. observe whether `/admin/workspace/landing*` compatibility paths are still needed;
3. if evidence stays quiet, run one small runtime-sunset wave focused only on those compatibility bridges.
