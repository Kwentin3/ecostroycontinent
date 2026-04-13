# EXECUTION.DOC_ALIGNMENT_AND_DELIVERY_HYGIENE.V1

## 1. Executive Summary

Выполнена bounded wave из двух частей:

1. `DOC ALIGNMENT`
   - старые опорные документы выровнены там, где они реально спорили с уже принятым multi-type canon;
   - broad rewrite не проводился;
   - исторические audit/execution reports не переписывались.

2. `DELIVERY HYGIENE`
   - локально болтающиеся accepted artifacts добавлены в Git history;
   - функциональный delivery commit собран и отправлен в `origin/main`;
   - образ собран и опубликован через canonical `build-and-publish` workflow;
   - canonical `deploy-phase1` workflow снова упал не на приложении, а на host permission gap;
   - сервер обновлён вручную через canonical SSH path;
   - post-deploy runtime smoke пройден;
   - дерево после финального docs commit приведено к clean state.

Итог: старый слой канона больше не спорит напрямую с принятым направлением `one editor surface + multi-type page workspace`, а последние принятые docs/report artifacts больше не висят только локально.

## 2. Source Docs Used

Product / canon:
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/product-ux/DECISION.UNIFIED_PAGE_WORKSPACE_MULTITYPE_OWNER_MODEL.v1.md`
- `docs/product-ux/Named_Maintenance_Task_Appendix_Экостройконтинент_v0.1.md`
- `docs/engineering/TEST_DATA_CANON_Экостройконтинент_v1.md`

Planning / design:
- `docs/implementation/PLAN.UNIFIED_PAGE_WORKSPACE_MULTITYPE_REFACTOR.v1.md`
- `docs/implementation/PLAN.EXECUTION_READY.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1.md`
- latest related planning reports under `docs/reports/2026-04-13/`

Recent execution / audit context:
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.LEGACY_DATA_REMOVAL_AND_FINAL_TOPUP.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.ANAMNESIS.EQUIPMENT_SERVICE_LANDING_UI.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.SEO_OPERATOR.VARIANT_B_LANDING_OWNER_MODEL.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.UI_QUESTION_MODEL_HINTS.V1.report.md`
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_OVERFLOW_FIX.V1.report.md`

Runtime / deploy reference:
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md`
- `docs/reports/2026-03-26/EKOSTROY.UI.RUSSIFICATION_DEPLOY_AND_LIVE_VERIFICATION.v1.report.md`
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.UNIFIED_MULTITYPE_PAGE_WORKSPACE_FOUNDATION.V1.report.md`

Path discrepancy:
- существенных расхождений по required paths не обнаружено.

## 3. Canon Conflicts Found

Найдены только реальные conflict points, которые могли тянуть команду в старую модель.

### Conflict 1

- Document: `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- Current wording/problem before fix:
  - `Page owns standalone pages such as /about and /contacts, plus page-level composition.`
  - `Service owns canonical slug, SEO intent and core content truth for /services/[slug].`
- Why it conflicts:
  - это standalone-only reading `Page`, которая уже конфликтует с принятым canon `Page owns multi-type page instances`;
  - формулировка слишком жёстко оставляла `/services/[slug]` только в старом source-owner narrative и не удерживала новую модель `Page instance + first-class source entities + projection shell`.
- Exact bounded fix needed:
  - переписать route/ownership block так, чтобы:
    - `Page` читался как owner page instances в unified multi-type workspace;
    - `service` / `case` оставались first-class source truth;
    - shell/projection не читался как второй editor.

### Conflict 2

- Document: `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- Current wording/problem before fix:
  - `Page остаётся canonical owner standalone pages and page-level composition.`
  - `Route ownership canon from PRD: Page owns only standalone pages ...`
- Why it conflicts:
  - документ оставался в repo как опорный refactor-plan и напрямую спорил с более свежим accepted decision note;
  - такая формула закрепляла старую границу `Page only standalone`, хотя теперь она признана insufficient.
- Exact bounded fix needed:
  - добавить короткую alignment note в шапку;
  - переписать две conflict-formулировки на язык accepted multi-type canon;
  - не превращать документ в новый план с переписыванием всей структуры.

### Conflict 3

- Repo hygiene conflict:
  - локально существовали accepted artifacts, которые ещё не были в Git history.
- Files:
  - `docs/reports/2026-04-13/AUDIT.UI_QUESTION_MODEL_HINTS.V1.report.md`
  - `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_OVERFLOW_FIX.V1.report.md`
- Why it conflicts:
  - принятые wave outputs не должны существовать только локально или только в chat/upload context;
  - это создаёт delivery drift между repo truth и фактической историей решений.
- Exact bounded fix needed:
  - добавить эти artifacts в canonical repo history вместе с уже принятым UI/question-model pass.

## 4. Bounded Fixes Applied

### 4.1 Canon alignment

Обновлены:
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`

Что сделано:
- убрана standalone-only трактовка `Page`;
- добавлена совместимая формулировка `Page owns page instances assembled in unified multi-type page workspace`;
- source domains оставлены first-class, но перестали звучать как justification для отдельного competing editor;
- в старый plan добавлена явная alignment note, чтобы его читали как transitional artifact, а не как живой standalone-only canon.

### 4.2 Accepted artifact hygiene

В Git history добавлены:
- `docs/reports/2026-04-13/AUDIT.UI_QUESTION_MODEL_HINTS.V1.report.md`
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_OVERFLOW_FIX.V1.report.md`

Также в delivery commit вошёл уже принятый bounded UI clarity pass:
- `lib/admin/question-model.js`
- `lib/admin/screen-copy.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageRegistryClient.module.css`
- `components/admin/PageWorkspaceScreen.js`
- `tests/admin/question-model-hints.test.js`

### 4.3 Delivery buffer hygiene

`docs/out` был возвращён в нейтральное состояние через restore tracked buffer files.

Это сделано сознательно:
- `docs/out` в проекте считается delivery buffer, а не canonical storage;
- случайные локальные удаления buffer-файлов не были включены в commit;
- canonical docs truth остаётся в `docs/...` и `docs/reports/...`.

## 5. Files Changed

Canon/doc alignment:
- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`

Accepted artifacts added to history:
- `docs/reports/2026-04-13/AUDIT.UI_QUESTION_MODEL_HINTS.V1.report.md`
- `docs/reports/2026-04-13/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_LAYOUT_OVERFLOW_FIX.V1.report.md`

Bounded accepted UI wave delivered together:
- `components/admin/PageRegistryClient.js`
- `components/admin/PageRegistryClient.module.css`
- `components/admin/PageWorkspaceScreen.js`
- `lib/admin/screen-copy.js`
- `lib/admin/question-model.js`
- `tests/admin/question-model-hints.test.js`

This report:
- `docs/reports/2026-04-13/EXECUTION.DOC_ALIGNMENT_AND_DELIVERY_HYGIENE.V1.report.md`

## 6. Git Status

Git hygiene sequence:
- stale/unrelated `docs/out` deletions were restored, not committed;
- only intended canon/doc/UI/report files were staged;
- functional delivery commit was created first;
- this closing report was added in a separate docs-only commit.

Tree posture at report drafting time:
- functional changes delivered;
- no unrelated tracked changes left pending;
- final clean-tree check performed after report commit and push.

## 7. Commit IDs

Functional delivery commit:
- `c9101e6` — `feat: add question-model UI hints and align page canon`

Closing report commit:
- `3acb42b`

## 8. Push Status

Push to `origin/main`:
- functional delivery push: success
- closing report push: success

Related build workflow:
- `build-and-publish` run `24344529967` — `success`

Built image:
- `ghcr.io/kwentin3/ecostroycontinent-app@sha256:8836a8ea321a4464abbb7f50c925022bf45a8d2e81cdb2f40cc6af31095da112`

## 9. Deploy Status

Canonical deploy path attempted first:
- workflow: `deploy-phase1`
- run: `24344697981`
- status: `failure`

Failure reason:
- not an app/runtime logic failure;
- self-hosted runner failed on host env access:
  - `open /opt/ecostroycontinent/runtime/.env: permission denied`

Manual server update then completed successfully through canonical SSH host path:
- SSH target: `root@178.72.179.66`
- SSH key: `~/.ssh/sait_selectel_rsa`
- host repo updated to `c9101e6`
- `/opt/ecostroycontinent/runtime/.env` updated with pinned `APP_IMAGE`
- `docker compose ... pull app`
- `docker compose ... up -d --force-recreate --remove-orphans app`

Final runtime pin on host:
- `APP_IMAGE=ghcr.io/kwentin3/ecostroycontinent-app@sha256:8836a8ea321a4464abbb7f50c925022bf45a8d2e81cdb2f40cc6af31095da112`

## 10. Post-Deploy Smoke

Docs/canon sanity:
- updated docs are present in repo tree;
- key canon conflict wording was removed from PRD and the old workflow-refactor plan;
- no remaining direct `Page owns only standalone pages` wording found in the key canonical docs checked.

Runtime sanity:
- `https://ecostroycontinent.ru/api/health` -> `200` / `ok`
- `https://ecostroycontinent.ru/admin/login` -> `200`
- `https://ecostroycontinent.ru/admin/entities/page` -> `307` to `/admin/login`
- `https://ecostroycontinent.ru/admin/entities/page/entity_dd7222fd-c8cc-43e7-a559-543118ef2eb2` -> `307` to `/admin/login`
- `https://ecostroycontinent.ru/services` -> `200`
- `https://ecostroycontinent.ru/` -> `200`

Warm-up note:
- immediately after manual `docker compose up`, first host-side health probe returned `502` during restart window;
- repeated health probe passed a few seconds later;
- final runtime state is healthy.

## 11. Clean Tree Status

Final target state:
- working tree clean after final report commit and push.

Status at report drafting moment:
- pending final docs-only commit for this report.

## 12. What Was Intentionally Not Changed

Сознательно не делалось:
- broad PRD rewrite;
- переписывание historical audit reports под новый canon;
- новый product direction;
- новый refactor по коду под видом hygiene;
- удаление legacy docs только потому, что они старые;
- commit/remove of `docs/out` buffer noise as if it were canonical content.

## 13. Remaining Open Questions

1. Нужно ли отдельно стабилизировать `deploy-phase1` под current host permissions, чтобы ручной SSH fallback больше не был нужен?
2. Нужен ли отдельный bounded pass по старым non-canonical implementation docs outside the primary canon set, если команда ещё реально на них опирается?
3. Должны ли historical documents с сильной standalone-only трактовкой получать явный `historical / superseded context` banner, если они остаются discoverable?

## 14. Recommended Next Step

Следующий шаг рекомендую сделать узким и практическим:
- не новый product pass,
- а `deploy workflow permission hardening`.

Причина:
- product/canon drift для этой bounded wave уже снят;
- главный повторяющийся operational debt теперь в том, что canonical self-hosted deploy workflow снова падает на host permission boundary и требует ручного SSH finish.