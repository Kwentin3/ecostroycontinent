# Removal Quarantine and Sweep Autonomous Execution Plan Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: execution-grade implementation plan / autonomous staged rollout  
Основание: [PRD_Removal_Quarantine_and_Sweep_Экостройконтинент_v0.1.md](./PRD_Removal_Quarantine_and_Sweep_Экостройконтинент_v0.1.md), [Removal_Quarantine_and_Sweep_Contract_Pack_Экостройконтинент_v0.1.md](./Removal_Quarantine_and_Sweep_Contract_Pack_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md)

## 0. Purpose of this plan

Этот документ переводит removal PRD и companion contract pack в жёсткий autonomous execution plan.

План должен дать один практический operating contour:

- в каком порядке внедрять новый parallel contour `mark -> analyze -> sweep`;
- какие границы у этого контура в v0.1;
- какие проверки обязательны на каждом этапе;
- какие commit slices и delivery steps допустимы;
- какой именно server-side acceptance нужен до признания фичи доказанной.

Этот документ не является новой product-дискуссией. Он фиксирует исполнение.

## 1. Execution environment and baseline assumptions

### 1.1 Canonical runtime

- canonical runtime и конечный acceptance contour = живой сервер;
- локальная машина используется для кодирования, unit/integration tests и build;
- отсутствие локального Postgres не меняет канон проверки;
- feature считается доказанной только после deploy и live verification на сервере;
- disposable test data на сервере допустимы только с явным префиксом `test_` и должны быть удалены после acceptance.

### 1.2 Supported entity types for v0.1

В первой волне поддерживаются только:

- `Service`
- `Case`
- `MediaAsset`
- `Gallery`

### 1.3 Explicit out of scope for this plan

В этой волне не расширять scope на:

- `Page`
- `GlobalSettings`
- auto-folding `test graph teardown` into the new contour
- hidden cross-entity republish automation
- background cleanup jobs / cron purge
- silent legacy delete removal

## 2. Execution constitution

### 2.1 Hard rules

- Новый contour идёт как parallel contour рядом с существующим delete path.
- Legacy delete остаётся живым до конца этой волны.
- `Publish` не bypass-ится и не ослабляется.
- `unmarked -> marked` always blocks purge.
- Sweep никогда не удаляет unmarked objects.
- Removal quarantine не становится заменой publish state.
- В этой волне mark не обязан автоматически делать `unpublished`.
- Любой failed gate = blocker для перехода к следующему stage.

### 2.2 Stop triggers

Если происходит хотя бы одно из нижеследующих событий, stage обязан остановиться:

- marked object всё ещё можно выбрать как новый relation target;
- analyzer и executor дают несовместимые verdicts;
- purge затрагивает unmarked entity;
- write-side quarantine обходится через server route;
- cleanup center скрывает реальный blocker или misleadingly показывает `ready`;
- deploy успешен, но live runtime contradicts local proof;
- test data не удаётся убрать с сервера после acceptance;
- требуется ручное unsafe DB intervention для прохождения acceptance.

### 2.3 Binary rule

Если что-то пошло не так, это blocker.

Нельзя:

- переходить к следующему stage с частично пройденным gate;
- считать локальные тесты заменой server acceptance;
- считать частично работающий purge достаточным;
- оставлять test data или partial graph mutations на сервере.

## 3. Delivery and proof discipline

### 3.1 Proof package required for every stage

Каждый stage обязан завершаться materialized proof package.

Minimum proof package:

- changed files;
- touched routes / APIs / DB seams;
- tests added or updated;
- exact local commands executed;
- stage result: `done`, `blocked`, or `not done`;
- explicit list of risks or open questions.

Для UI stages дополнительно обязательны:

- browser evidence or screenshots;
- covered operator scenarios;
- state coverage note.

Для runtime stages дополнительно обязательны:

- checked endpoints/screens;
- note whether evidence is local-only or server-verified;
- exact cleanup result for any `test_` data.

### 3.2 Commit discipline

Каждый stage должен materialize at least one intentional commit slice.

Commit boundary rule:

- один commit = один функциональный шаг, который можно объяснить без “и ещё заодно”; 
- нельзя коммитить Stage N+1 вместе с незакрытым Stage N;
- если stage blocked, коммит с partial/fake completion недопустим.

### 3.3 Rollback posture

Пока фича не доказана на сервере:

- legacy/manual delete остаётся intact;
- новый contour может быть partially merged only if previous stage gates are fully green;
- если live verification contradicts the intended behavior, rollout считается blocked until fixed and re-proven.

## 4. Stage chain summary

| Stage | Goal | Main output | Required proof before next stage |
| --- | --- | --- | --- |
| Stage 0 | Boundary freeze | Fixed scope, ownership, routes, seams | No open ambiguity across PRD and contract pack |
| Stage 1 | Persisted mark substrate | DB + repository + audit basis | Mark round-trip and audit tests green |
| Stage 2 | Mark/unmark operator entry points | Editor/list actions and visible status | UI smoke green, wording honest |
| Stage 3 | Write-side quarantine | No new incoming refs to marked targets | Picker + save validation proven |
| Stage 4 | Analyzer core | Deterministic `ready` / `blocked` verdicts | Analyzer truth suite green |
| Stage 5 | Cleanup center UI | One system screen for marked components | Read-only diagnosis proven |
| Stage 6 | Purge executor | Safe deletion of ready components only | Executor proofs green |
| Stage 7 | Legacy coexistence | New path primary, old path explicit fallback | UX and routing stable |
| Stage 8 | Git, deploy, server acceptance | Live feature proof on server | Live pass green, `test_` data removed |

## 5. Detailed stage plan

### 5.1 Stage 0 - Boundary freeze and execution shell

#### goal

Зафиксировать exact implementation boundary и не дать фиче превратиться в lifecycle rewrite.

#### deliverables

- final supported entity-type list for v0.1;
- exact route ownership of the new cleanup center;
- final naming of the new operator path and legacy/manual fallback path;
- stage map and commit slices accepted.

#### likely files or seams

- PRD and companion contract pack alignment
- admin navigation seam
- future `lib/admin/*` removal module area
- future cleanup center route

#### implementation notes

- кодовое поведение пока не меняется;
- допускаются только harmless placeholders or route stubs if they reduce later drift.

#### required verification

- manual consistency pass across PRD and contract pack;
- exact owner decision log for supported entity types;
- no unresolved ambiguity about whether mark implies delete or quarantine.

#### success criteria

- команда может назвать точные files/routes/modules for Stages 1-6;
- поддерживаемые типы и out-of-scope types больше не спорные;
- legacy coexistence rule зафиксирован и понятен.

#### acceptance criteria

- нет конфликта между PRD и contract pack;
- нет давления silently fold-in `Page` or `GlobalSettings` into v0.1;
- implementation can proceed without reopening product intent.

#### commit stage

Recommended commit:

- `Зафиксировать автономный execution plan quarantine sweep`

#### blockers

- unresolved disagreement about scope;
- попытка сразу заменить legacy delete;
- попытка silently introduce auto-unpublish in v0.1 without contract update.

### 5.2 Stage 1 - Persisted removal mark substrate and audit basis

#### goal

Ввести минимальный persisted removal state и audit basis без тяжёлого UI refactor.

#### deliverables

- migration for removal mark fields;
- repository/entity aggregate support for removal mark state;
- mark/unmark audit events;
- deterministic projection of mark state in aggregate reads.

#### likely code areas

- `db/migrations/*`
- `lib/content-core/repository.js`
- `lib/content-core/content-types.js`
- audit helpers and admin operation logging

#### required verification

Local:

- `npm test`
- targeted migration/repository/audit suites
- `npm run build`

Proof expectations:

- mark fields round-trip through aggregate reads;
- audit writes are visible and deterministic;
- no existing publish/delete flows regress.

#### success criteria

- supported entities can persist mark/unmark state;
- mark state is readable without ambiguity;
- audit evidence exists for mark/unmark operations.

#### acceptance criteria

- no regression in existing delete safety tests;
- no regression in publish workflow tests;
- migration does not introduce conflicting source-of-truth semantics.

#### commit stage

Recommended commit:

- `Добавить persisted removal state и audit substrate`

#### blockers

- migration collides with current entity/revision model;
- aggregate reads become ambiguous;
- audit integration weakens existing operation flows.

### 5.3 Stage 2 - Mark/unmark operator entry points

#### goal

Дать оператору явные mark/unmark actions и видимую removal-quarantine semantics в editor and list surfaces.

#### deliverables

- `Пометить на удаление` action on supported entity editors;
- `Снять пометку` action on marked supported entities;
- visible list badge/filter/status for marked objects;
- operator copy explaining that final cleanup happens elsewhere.

#### likely code areas

- `components/admin/EntityEditorForm.js`
- supported registry/list surfaces
- mark/unmark admin POST routes
- small admin projection helpers

#### required verification

Local:

- `npm test`
- targeted UI/source contract tests
- route tests for mark/unmark endpoints
- `npm run build`

Manual:

- mark an entity;
- verify badge/status in editor and list;
- unmark the entity;
- verify normal state returns.

#### success criteria

- operator can mark and unmark from normal admin surfaces;
- marked status is immediately visible;
- wording does not imply immediate hard delete.

#### acceptance criteria

- supported entities expose mark/unmark actions;
- unsupported entity types do not silently gain partial support;
- legacy delete path is still visible and unchanged in meaning.

#### commit stage

Recommended commit:

- `Добавить mark и unmark действия в админке`

#### blockers

- mark action is available for unsupported types;
- UI makes mark look like immediate delete;
- editor/list wording is ambiguous about quarantine semantics.

### 5.4 Stage 3 - Write-side quarantine enforcement

#### goal

Сделать removal quarantine реальным write-side contract, а не декоративным флагом.

#### deliverables

- picker exclusion or disabled state for marked targets;
- save-route validation blocking new refs to marked objects;
- readiness/validation copy explaining the block;
- proven guardrails across supported entity types.

#### likely code areas

- picker data sources
- relation validators
- save routes
- readiness helpers
- supported form data builders

#### required verification

Local:

- `npm test`
- targeted picker tests
- targeted save validation tests
- `npm run build`

Manual:

- mark target A;
- open supported editor B;
- verify A cannot be newly attached;
- attempt forced payload injection;
- verify server-side rejection.

#### success criteria

- marked object cannot be used in a new saved relation;
- server-side validation holds even if UI is bypassed;
- operator receives clear blocking message.

#### acceptance criteria

- no supported write path can attach a marked target;
- existing non-marked relation flows still work;
- readiness semantics and save semantics do not diverge.

#### commit stage

Recommended commit:

- `Запретить новые ссылки на marked removal targets`

#### blockers

- any supported save path still allows attaching marked target;
- picker exclusion works but save route does not;
- validation text hides the real reason for refusal.

### 5.5 Stage 4 - Removal analyzer core

#### goal

Построить deterministic analyzer, который превращает marked objects в removal components и честно отличает `ready` from `blocked`.

#### deliverables

- graph traversal for supported entity types;
- component building;
- external incoming ref detection;
- outgoing unmarked ref classification;
- state blocker collection;
- stable analyzer DTO for UI and executor.

#### likely code areas

- new `lib/admin/removal-sweep-analysis.js`
- shared graph/reference helpers
- safe reuse of existing delete/test-teardown knowledge where appropriate

#### required analyzer output

- component members;
- incoming unmarked refs;
- outgoing unmarked refs;
- state blockers;
- verdict;
- human-readable reasons;
- links or IDs of blocking objects.

#### required verification

Local:

- targeted analyzer suite
- `npm test`
- `npm run build`

Required truth scenarios:

- isolated marked component -> `ready`
- `unmarked -> marked` -> `blocked`
- `marked -> unmarked` without reverse dependency -> allowed
- open obligation -> `blocked`
- review revision -> `blocked`
- shared node retained by unmarked object -> `blocked`

#### success criteria

- analyzer verdicts are deterministic;
- analyzer respects both graph blockers and state blockers;
- analyzer never treats mark as implicit delete.

#### acceptance criteria

- analyzer output is stable enough to be reused by UI and executor;
- analyzer agrees with existing safety expectations from delete and teardown logic;
- blocker objects are explicit, not generic.

#### commit stage

Recommended commit:

- `Добавить analyzer для removal sweep`

#### blockers

- analyzer cannot distinguish internal marked refs from external incoming refs;
- analyzer says `ready` where existing safety logic would still forbid destruction;
- analyzer output is too unstable to drive UI or executor.

### 5.6 Stage 5 - Cleanup center UI, diagnosis first

#### goal

Сделать один system screen, где оператор видит весь marked set, ready components и blockers, ещё без destructive purge.

#### deliverables

- cleanup center route;
- system menu entry;
- grouping by component;
- `ready` and `blocked` sections;
- operator-friendly blocker summaries;
- visibility of exact blocking objects or state blockers.

#### likely code areas

- new admin route under `app/admin/(console)/...`
- admin navigation
- UI components for component summaries and blocker cards
- analyzer projection adapters

#### required verification

Local:

- `npm test`
- route rendering tests
- projection tests
- RU copy tests
- `npm run build`

Manual:

- open cleanup center with no marked entities;
- open cleanup center with mixed `ready` and `blocked` samples;
- verify wording answers:
  - what is marked;
  - what is ready;
  - what exactly blocks the rest.

#### success criteria

- operator can find all marked objects from one place;
- blocked component shows exact blocker object or exact state blocker;
- no purge CTA exists yet for blocked components.

#### acceptance criteria

- screen does not list raw IDs without meaning;
- ready/blocked grouping is honest and not misleading;
- cleanup center does not imply that mark already removed live truth.

#### commit stage

Recommended commit:

- `Добавить cleanup center для marked объектов`

#### blockers

- screen hides real blockers;
- grouping is inconsistent with analyzer truth;
- UI copy suggests mark equals delete.

### 5.7 Stage 6 - Purge executor for ready components

#### goal

Добавить bounded destructive executor, который удаляет только `ready` components и делает это в dependency-aware order.

#### deliverables

- purge route or server action;
- one final confirm per component purge;
- deterministic execution order;
- audit trail for purge;
- refusal path for blocked component.

#### likely code areas

- purge executor module
- admin route/action
- audit integration
- careful reuse of existing delete helpers where safe

#### required verification

Local:

- targeted purge suites
- `npm test`
- `npm run build`

Required scenarios:

- isolated ready component purge success;
- blocked component purge refusal;
- no unmarked collateral deletion;
- deterministic execution order;
- audit events recorded.

#### success criteria

- executor deletes a ready component end-to-end;
- executor never touches unmarked objects;
- executor refuses blocked component without side effects.

#### acceptance criteria

- no dangling refs or partial silent deletions in supported scenarios;
- executor verdict matches analyzer verdict;
- audit trail is complete enough to explain what was purged.

#### commit stage

Recommended commit:

- `Добавить purge executor для ready components`

#### blockers

- executor touches unmarked object;
- executor and analyzer disagree on readiness;
- purge can partially mutate graph then fail without explicit refusal semantics.

### 5.8 Stage 7 - Legacy coexistence and operator guidance

#### goal

Поставить новый contour в primary position, а старый delete path честно перевести в legacy/manual fallback without breaking it.

#### deliverables

- cleanup center as the recommended path;
- legacy labeling on current manual delete path;
- explicit fallback wording for unsupported and edge scenarios;
- navigation and help copy aligned.

#### likely code areas

- admin navigation
- entity editor entry points
- existing delete screen labels
- small help copy / fallback links

#### required verification

Local:

- `npm test`
- label/source contract tests
- `npm run build`

Manual:

- open cleanup center from system navigation;
- open legacy delete from supported entity;
- verify both paths are understandable and not contradictory.

#### success criteria

- operator sees cleanup center as preferred path;
- legacy flow remains reachable and functional;
- wording clearly differentiates new vs legacy/manual path.

#### acceptance criteria

- legacy flow is not silently removed;
- operator can understand when to use each path;
- there are no duplicate primary CTAs with conflicting meaning.

#### commit stage

Recommended commit:

- `Пометить legacy delete как manual fallback`

#### blockers

- legacy path disappears before the new contour is proven;
- cleanup center and legacy path compete as equal primaries;
- wording implies legacy is broken rather than fallback/manual.

### 5.9 Stage 8 - Git delivery, deploy and live server acceptance

#### goal

Доставить feature на сервер и доказать её в реальном operational contour, а не только локально.

#### deliverables

- pushed git branch with intentional stage-bounded commits;
- successful `build-and-publish` run;
- immutable image digest captured;
- successful `deploy-phase1` run;
- live server acceptance proof;
- confirmed cleanup of any `test_` data.

#### pre-deploy local verification

Обязательно перед push/deploy:

- `npm test`
- `npm run build`
- all targeted suites added in this wave
- `git diff --check`

#### delivery chain

1. Verify branch scope and worktree state.
2. Commit stage-bounded changes intentionally.
3. Push working branch to GitHub.
4. Run `build-and-publish` for that branch.
5. Resolve immutable image digest.
6. Run `deploy-phase1` with pinned digest.
7. Wait for deploy completion.
8. Run live verification on `https://ecostroycontinent.ru`.
9. Remove all disposable `test_` data.
10. Return runtime to safe baseline state if any operational toggle was changed.

#### recommended commands

Git:

- `git status --short`
- `git add <intended files>`
- `git commit -m "<stage-bounded message>"`
- `git push origin <branch>`

Build and publish:

- `gh workflow run build-and-publish.yml --ref <branch>`
- `gh run list --workflow build-and-publish.yml --limit 5`
- `gh run watch <run-id>`

Resolve digest:

- `docker buildx imagetools inspect ghcr.io/kwentin3/ecostroycontinent-app:<tag>`
  or the equivalent exact image ref produced by the workflow

Deploy:

- `gh workflow run deploy-phase1.yml -f image_ref=<immutable-digest-ref>`
- `gh run list --workflow deploy-phase1.yml --limit 5`
- `gh run watch <run-id>`

Server checks:

- `curl https://ecostroycontinent.ru/api/health`
- live browser verification through admin UI

#### required live test data policy

Если для acceptance нужны disposable runtime entities:

- все такие сущности обязаны иметь префикс `test_`;
- использовать только минимально необходимый набор;
- после acceptance удалить всё созданное;
- в финальном отчёте отдельно перечислить:
  - что создано;
  - что удалено;
  - что не удалено и почему.

#### mandatory live acceptance scenarios

1. `mark + unmark`
- create or use a bounded `test_` entity;
- mark it;
- verify visible marked state in editor and cleanup center;
- unmark it;
- verify state returns to normal.

2. `picker enforcement`
- mark a `test_` target;
- open another supported editor;
- verify the marked target cannot be selected as new relation.

3. `blocked component`
- create or assemble scenario where unmarked object points to marked object;
- verify cleanup center shows `blocked` and exact blocker object;
- verify purge is unavailable or refused.

4. `ready component`
- create a minimal isolated marked component;
- verify cleanup center shows `ready`;
- execute purge with final confirm;
- verify only intended marked objects disappear.

5. `legacy coexistence`
- verify legacy/manual delete path still opens;
- verify it is explicitly labeled as fallback/manual.

6. `runtime safety`
- confirm no unexpected 5xx during admin flows;
- confirm cleanup center and related routes work on live server;
- confirm health endpoint remains green.

#### success criteria

- live server is healthy after deploy;
- mark/unmark works on live server;
- picker enforcement works on live server;
- blocked component and ready component are both proven;
- purge removes only intended marked objects;
- no `test_` data remains after acceptance;
- runtime is restored to safe baseline state.

#### acceptance criteria

- server behavior matches local proof;
- no unsafe manual DB intervention is needed;
- all live acceptance scenarios are completed and documented;
- final result is independently verified on the server, not inferred.

#### commit and release stage

Recommended final delivery commits are the stage-bounded commits from Stages 1-7 plus, if needed, one final polish commit only for verified acceptance fixes.

Final delivery report must include:

- commit SHAs;
- workflow run IDs;
- image digest;
- exact server checks run;
- `test_` entities created and removed;
- final verdict: `accepted` or `blocked`.

#### blockers

- deploy succeeds but live behavior contradicts local proof;
- cleanup center works locally but fails on server;
- `test_` data cannot be fully removed;
- acceptance needs unsafe DB intervention;
- server routes return unexpected 5xx.

## 6. Recommended commit ladder

The preferred commit ladder is:

1. `Зафиксировать автономный execution plan quarantine sweep`
2. `Добавить persisted removal state и audit substrate`
3. `Добавить mark и unmark действия в админке`
4. `Запретить новые ссылки на marked removal targets`
5. `Добавить analyzer для removal sweep`
6. `Добавить cleanup center для marked объектов`
7. `Добавить purge executor для ready components`
8. `Пометить legacy delete как manual fallback`
9. `Исправить verified acceptance issues` only if needed after live proof

## 7. Stage acceptance rule

Каждый stage считается принятым только если одновременно выполнены все условия:

- local tests green;
- build green;
- stage-specific success criteria satisfied;
- stage-specific acceptance criteria satisfied;
- no listed blocker active;
- proof package materialized.

Если хотя бы одно условие не выполнено, stage blocked.

## 8. Final feature success criteria

Фича считается успешно реализованной только если доказано всё ниже:

- operators can mark and unmark supported objects;
- marked objects no longer accept new incoming refs;
- cleanup center shows marked components honestly;
- blocked components show exact blocker objects or state blockers;
- ready components can be purged safely;
- purge never deletes unmarked objects;
- legacy delete remains available as fallback;
- deploy and live server verification are completed successfully;
- no disposable `test_` data remains on server after acceptance.

## 9. Final release acceptance

Release acceptance is binary.

Accepted only if:

- all stages passed;
- live server proof is green;
- no cleanup leftovers remain;
- no blocker is unresolved.

Rejected if:

- any stage failed its gate;
- live behavior is not independently proven;
- server verification contradicts local assumptions;
- `test_` data or partial graph mutations remain after acceptance.

## 10. Final implementation rule

Если что-то пошло не так, это blocker.

Не продолжать следующую стадию, не считать partial pass достаточным, не подменять server proof локальной уверенностью и не оставлять живой контур в промежуточном состоянии. Для этой фичи safety, graph integrity и честная live verification важнее скорости закрытия.