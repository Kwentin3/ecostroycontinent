# Implementation Execution Report

## 1. Executive Summary
- Выполнен bounded follow-up epic поверх уже внедрённой single-workflow model для домена `Страницы`.
- Закрыты 4 целевых зоны: registry-native create flow, viewport switcher внутри unified page workspace preview, физический cleanup dead legacy landing-workspace UI, bounded polish фильтров реестра.
- Канон не переоткрывался: `Page` остался canonical owner, AI не расширялся, preview остался на canonical `StandalonePage`, metadata/publish/review/history semantics не менялись.

## 2. Source Docs Used
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_SINGLE_WORKFLOW_EPIC.V1.report.md`
- `docs/reports/2026-04-10/ADMIN.ANAMNESIS.AI_LAYOUT_VS_PAGES_AUDIT.v1.md`
- `docs/reports/2026-04-10/DOCS.REFINE.PAGES_SINGLE_WORKFLOW.V1.report.md`

## 3. Scope Actually Implemented
- Registry-native primary create entry for pages.
- Post-create redirect directly into `/admin/entities/page/[pageId]`.
- Fallback preservation for `/admin/entities/page/new`.
- Viewport switcher inside workspace preview with the same canonical renderer.
- Removal of dead landing-workspace Stage A UI layer and its dead helper/test.
- Registry filters extended with `missing` and `inactive`.
- Lightweight `updatedAt` surface on page cards/list rows.

## 4. Gating Decisions Taken
- Create flow: primary narrative moved into registry modal; old `/admin/entities/page/new` kept as secondary fallback route only.
- Create payload: kept bounded to `pageType + title`, with `h1 = title` on first draft to satisfy canonical page schema without inventing a wizard.
- Preview convergence: reused existing `PreviewViewport` as a pure UI control and kept `StandalonePage` as the only renderer.
- Legacy cleanup boundary: deleted only dead UI/workspace helper modules with no runtime imports; kept redirect routes and deprecated API stubs as intentional compatibility bridges.
- Registry polish boundary: added only operator-useful `missing` / `inactive` filters plus subtle last-updated metadata; no dashboard expansion.

## 5. What Was Done By Slice
### Slice A. Create Flow
- Added in-registry button `Новая страница` and lightweight create modal in `components/admin/PageRegistryClient.js`.
- Added registry-native form posting to existing canonical save route with `redirectMode=page_workspace`.
- Extended `app/api/admin/entities/[entityType]/save/route.js` to support bounded redirect routing:
  - success -> new page workspace;
  - failure -> registry fallback (`/admin/entities/page?create=1`).
- Removed top-level page create CTA from `app/admin/(console)/entities/[entityType]/page.js`; create is now owned by the registry surface.
- Preserved `/admin/entities/page/new` as technical fallback, exposed only as secondary link inside the modal.

### Slice B. Preview Parity
- Extended `components/admin/PreviewViewport.js` to support local in-screen device switching via `onDeviceChange`.
- Integrated viewport switcher into `components/admin/PageWorkspaceScreen.js`.
- Kept preview on canonical `StandalonePage`; no second renderer introduced.

### Slice C. Legacy Cleanup
- Deleted dead legacy Stage A landing-workspace UI:
  - `components/admin/LandingWorkspaceStageAScreen.js`
  - `components/admin/LandingWorkspaceStageAScreen.module.css`
  - `lib/admin/landing-workspace-ui.js`
  - `lib/admin/landing-workspace.js`
  - `tests/landing-workspace-ui.test.js`
- Ran runtime reference sweep after deletion; no remaining imports/usages in `app/`, `components/`, `lib/`, `tests/`.
- Kept compatibility pieces alive:
  - `/admin/workspace/landing`
  - `/admin/workspace/landing/[pageId]`
  - `/api/admin/workspace/landing/[pageId]`

### Slice D. Registry Filter Polish
- Added `missing` and `inactive` values to page registry filters in `components/admin/PageRegistryClient.js`.
- Added `inactive` support to summary bullets in `lib/admin/list-visibility.js`.
- Added subtle `updatedAtLabel` projection in `app/admin/(console)/entities/[entityType]/page.js` and surfaced it in cards/list rows.

## 6. Registry-Native Create Flow Notes
- Existing canonical `saveDraft()` lifecycle was preserved.
- No new create entity or second create-domain introduced.
- Error return path stays inside the registry and can reopen the create modal through `?create=1`.
- `Page` ownership remains canonical because creation still goes through the same save route and draft model.

## 7. Viewport Switcher Notes
- The switcher is UI-only and does not fork preview architecture.
- Review preview and workspace preview now share the same `PreviewViewport` abstraction plus the same `StandalonePage` renderer.
- Device change is local state in the workspace; no URL contract change was needed there.

## 8. Legacy Cleanup Notes
- Deleted only code that had become dead after the previous single-workflow epic.
- Did not touch `lib/landing-workspace/*` runtime domain code because parts of that layer still support bounded AI/domain flows outside the deleted Stage A UI.
- Did not remove redirect routes or deprecated API stubs because they still protect old deep links.

## 9. Registry Filter Notes
- `missing` now surfaces pages without any revision.
- `inactive` now surfaces pages whose published revision exists in history but no longer owns the live pointer.
- `updatedAt` is intentionally lightweight and does not turn cards into analytics/dashboard tiles.

## 10. Files/Modules Removed
- `components/admin/LandingWorkspaceStageAScreen.js`
- `components/admin/LandingWorkspaceStageAScreen.module.css`
- `lib/admin/landing-workspace-ui.js`
- `lib/admin/landing-workspace.js`
- `tests/landing-workspace-ui.test.js`

## 11. Files/Modules Changed
- `app/admin/(console)/entities/[entityType]/page.js`
- `app/api/admin/entities/[entityType]/save/route.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageRegistryClient.module.css`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PreviewViewport.js`
- `lib/admin/list-visibility.js`
- `tests/admin/entity-save.route.test.js`
- `tests/admin/list-visibility.test.js`

## 12. Tests/Checks Run
- `npm test`
- `npm run build`
- `rg -n "LandingWorkspaceStageAScreen|landing-workspace-ui|buildLandingWorkspaceHref|loadLandingWorkspaceChooserData|loadLandingWorkspacePageData" app components lib tests`
  - result: no runtime/test references remained after cleanup.

## 13. Delivery / Push / Deploy Notes
- Локальная реализация доведена до passing test/build state.
- Commit/push не делались, потому что worktree уже содержит широкий набор несвязанных и ранее существовавших изменений вне bounded follow-up epic; отдельный commit из этого состояния был бы рискованным и мог бы захватить чужой scope.
- Отдельный delivery step после ревью рабочего дерева остаётся возможным.

## 14. Risks Found
- Registry create modal intentionally does not preserve partially entered values after server-side validation failure; сейчас это bounded tradeoff ради сохранения narrow scope и без client-side wizard state.
- Compatibility redirects всё ещё остаются в дереве и требуют отдельного future cleanup once deep-link window is closed.

## 15. What Was Intentionally Deferred
- Не трогал review/publish/history flows.
- Не расширял AI panel beyond current patch-only semantics.
- Не превращал page create в multi-step wizard.
- Не убирал legacy redirect routes и deprecated API stubs.
- Не делал новый docs-refactor beyond this execution report.

## 16. Remaining Open Questions
- Нужен ли в следующем небольшом эпике client-side preservation of create modal fields on validation error, или текущего registry reopen достаточно.
- Когда можно безопасно удалить compatibility redirects `/admin/workspace/landing*` после подтверждения отсутствия external deep links.

## 17. Recommended Next Step
- Следующий bounded step: delivery hygiene around legacy compatibility sunset.
  - подтвердить usage/no-usage legacy redirects;
  - после safe window удалить deprecated route stubs;
  - затем сделать отдельный small PR на delivery/cleanup without mixing product work.
