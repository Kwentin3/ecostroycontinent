# Deletion Safety and Forensic Unification Autonomous Execution Plan Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: implementation-facing refactor execution plan  
Назначение: провести поэтапный рефакторинг destructive lifecycle контура так, чтобы граф зависимостей, destructive execution и forensic traceability проходили через единые изолированные точки выполнения.

## 1. Основание

План опирается на следующие документы истины:

- [PRD_Экостройконтинент_v0.3.1.md](./PRD_Экостройконтинент_v0.3.1.md)
- [Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md](./Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md)
- [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md)
- [Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md](./Admin_Operations_Contract_First_Slice_Экостройконтинент_v0.2.md)
- [Admin_Implementation_Plan_First_Slice_Экостройконтинент_v0.1.md](./Admin_Implementation_Plan_First_Slice_Экостройконтинент_v0.1.md)
- [Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md](./Diagnostics_Forensics_Audit_Spec_Экостройконтинент_v0.1.md)
- [PRD_Removal_Quarantine_and_Sweep_Экостройконтинент_v0.1.md](./PRD_Removal_Quarantine_and_Sweep_Экостройконтинент_v0.1.md)
- [Removal_Quarantine_and_Sweep_Contract_Pack_Экостройконтинент_v0.1.md](./Removal_Quarantine_and_Sweep_Contract_Pack_Экостройконтинент_v0.1.md)
- [AUDIT.DELETE_SAFETY_PATTERN_AND_FORENSIC_GAPS.ECOSTROYCONTINENT.V1.report.md](../reports/2026-04-19/AUDIT.DELETE_SAFETY_PATTERN_AND_FORENSIC_GAPS.ECOSTROYCONTINENT.V1.report.md)

## 2. Что именно решает этот рефакторинг

Этот рефакторинг не меняет launch-модель, не расширяет product scope и не переписывает publish workflow.

Он решает узкий, но критичный класс проблем:

- destructive operations сейчас считают граф по нескольким разным локальным моделям;
- часть UI surfaces показывает оператору неполную или вводящую в заблуждение картину;
- destructive mutations логируются неравномерно;
- post-delete forensic reconstruction сейчас структурно слабая;
- `equipment` и другие реальные типы сущностей имеют неполный lifecycle parity в delete/deactivation/teardown paths.

## 3. Жёсткие канонические ограничения

План обязан сохранять следующие non-negotiable правила:

1. Publish остаётся explicit и revision-based.
2. Approval и publish остаются отдельными операциями.
3. Published read-side потребляет только active published revisions.
4. Removal quarantine не становится shortcut вокруг publish discipline.
5. Новый контур не ослабляет существующие protections published truth.
6. `Page` не получает новое право владеть route truth `Service` / `Case` / `Article`.
7. Audit events рождаются downstream from domain operations, а не как UI-суррогат.
8. Нельзя делать silent destructive sweep.
9. Нельзя удалять unmarked collateral objects.
10. Нельзя размазывать graph truth по нескольким helper’ам после завершения рефакторинга.

## 4. Плановые принципы исполнения

### 4.1 Изоляция прежде всего

В рефакторинге главным критерием является не скорость переписывания, а сокращение количества мест, где destructive truth живёт параллельно.

Целевое состояние:

- один canonical graph kernel;
- один destructive orchestration layer;
- один forensic ledger contour;
- thin UI surfaces и thin routes.

### 4.2 Не big bang, а staged replacement

Рефакторинг идёт как staged replacement.

Это означает:

- сначала вводятся новые seams и общий kernel;
- затем на них по очереди переводятся существующие execution paths;
- только после подтверждённого parity старые локальные helper’ы выводятся из primary usage.

### 4.3 Каждый следующий этап блокируется при провале предыдущего

Если acceptance текущего этапа не пройден, следующий этап не стартует.

Это особенно важно для:

- audit storage migration;
- переключения hot destructive paths;
- UI rerouting с legacy path на unified path.

## 5. High-level stage map

| Stage | Название | Главный результат |
| --- | --- | --- |
| 0 | Contract lock and seam map | Зафиксированы target seams, owned boundaries и rollout posture |
| 1 | Canonical graph kernel | Один source of truth для refs, usage и destructive graph decisions |
| 2 | Unified destructive operations layer | Один application contour для analyze / decide / execute / post-actions |
| 3 | Forensic ledger hardening | Удаление и blocked destructive attempts становятся reconstructable после hard delete |
| 4 | Path migration and legacy fencing | Hot paths и UI переведены на единый execution contour |
| 5 | Entity parity and policy normalization | Все реальные entity types получают consistent destructive behavior |
| 6 | Verification matrix and live acceptance | Доказана техническая надёжность на тестах и на живом сервере |
| 7 | Delivery, rollout, and post-deploy watch | Изменения довезены, проверены и оставлены в контролируемом состоянии |

## 6. Детальный план по этапам

### Stage 0. Contract lock and seam map

Цель:

Перед любым кодом зафиксировать точный refactor scope и не смешать новый unified contour с product drift.

Что делаем:

- сверяем текущий audit с removal/quarantine contract и forensic spec;
- фиксируем, какие path'ы converged в общий kernel сразу, а какие временно остаются specialized policy surfaces;
- фиксируем, что `test-graph-teardown` на первом проходе не обязан исчезнуть как отдельная capability, но должен перестать жить на отдельной graph truth;
- фиксируем target layering:
  - `lib/content-core/*` = canonical reference and invariant layer;
  - `lib/content-ops/*` = destructive operations orchestration;
  - `app/api/admin/*` = thin transport routes;
  - `components/admin/*` = thin operator surfaces;
- фиксируем целевой audit/ledger contract для destructive actions.

Артефакты этапа:

- this execution plan;
- narrow implementation addendum only if any existing contract must be tightened;
- explicit list of legacy paths that will remain fallback during rollout.

Критерии приёмки:

- нет двусмысленности, что считается canonical graph kernel;
- нет двусмысленности, какие operations обязаны писать forensic trace;
- нет двусмысленности, остаётся ли `test-graph-teardown` distinct capability на первом проходе;
- rollout posture и legacy posture записаны явно.

Блокеры:

- если не зафиксирован носитель persistent delete ledger;
- если не зафиксировано, где проходит граница между shared kernel и specialized policy module.

### Stage 1. Canonical graph kernel

Цель:

Свести destructive graph truth в один слой, чтобы incoming refs, outgoing refs, shared node detection, usage inventory и marked-ref conflicts считались по одной модели.

Что делаем:

- выносим canonical APIs для:
  - collect outgoing refs;
  - collect incoming refs;
  - detect shared nodes;
  - detect external incoming refs into marked component;
  - media usage index;
  - gallery membership / collection usage index;
  - marked-reference conflict detection;
- расширяем kernel так, чтобы он first-class покрывал:
  - `media_asset`
  - `gallery`
  - `service`
  - `case`
  - `page`
  - `equipment`
- прекращаем развитие новых локальных `TARGET_SOURCE_TYPES`, `SOURCE_TYPES_BY_TARGET`, локальных `referencesTarget(...)` в helper’ах;
- оставляем только thin adapters там, где полная замена делается на следующем этапе.

Важно:

На этом этапе мы не обязаны сразу переписать весь UI. Но любая новая graph decision logic уже должна идти только через kernel.

Критерии приёмки:

- существует один canonical module family для graph truth;
- hot-path helpers больше не владеют собственной graph semantics;
- `equipment` имеет parity с остальными типами в kernel-level tests;
- media usage / orphan / archive eligibility считаются через тот же graph kernel, что и delete blockers.

Блокеры:

- если хотя бы один real entity type в публичном или admin контуре не покрыт kernel parity;
- если media usage inventory продолжает считать граф отдельно от destructive blockers.

### Stage 2. Unified destructive operations layer

Цель:

Собрать destructive lifecycle в один application orchestration contour.

Что делаем:

- вводим единый destructive operations layer с понятными фазами:
  - analyze
  - decide
  - confirmable action model
  - execute
  - post-actions
  - audit/ledger write
- переводим операции на единый envelope:
  - legacy safe delete
  - removal sweep purge
  - live deactivation
  - test-graph teardown
  - legacy test fixture normalization
- каждая операция реализуется как policy profile на shared execution skeleton, а не как отдельный мир с собственной graph truth;
- raw repository mutations больше не вызываются напрямую из route/helper UI paths без прохождения через orchestration layer.

Важно:

`test-graph-teardown` может остаться отдельным operator capability, но должен использовать shared graph kernel и shared destructive execution envelope, а не свой автономный world model.

Критерии приёмки:

- routes становятся thin transport wrappers;
- blocked destructive attempt и successful destructive mutation возвращают структурированный domain result;
- больше нет разбросанных direct calls к `deleteEntityById`, `clearEntityActivePublishedRevision`, `markPublishObligationCompleted` из разных path'ов без общего orchestration context;
- audit emission происходит из operations layer.

Блокеры:

- если хотя бы один hot destructive path всё ещё обходит общий orchestration contour;
- если shared operations layer не умеет выразить specialized policy без копирования логики.

### Stage 3. Forensic ledger hardening

Цель:

Сделать destructive operations reconstructable даже после hard delete.

Что делаем:

- проектируем и внедряем append-only destructive ledger, не завязанный на cascade delete удаляемой сущности;
- определяем minimal mandatory payload для destructive events:
  - actor
  - role context
  - operation kind
  - target root
  - graph snapshot / component members
  - blocker summary or execution summary
  - performed mutations
  - storage side effects
  - timestamp / correlation id
- сохраняем human-readable summary и stable machine-readable codes;
- отделяем entity timeline UX от persistent forensic storage:
  - entity timeline может оставаться scoped to entity;
  - deletion reconstruction должна жить в отдельном ledger / view / inspection path;
- доводим все blocked и successful destructive mutations до contract parity с forensic spec.

Важно:

Нельзя считать задачу решённой, если delete events по-прежнему исчезают вместе с entity rows.

Критерии приёмки:

- удалённую сущность и её destructive history можно реконструировать после hard delete;
- blocked destructive attempts тоже оставляют понятный след;
- audit contract отвечает на вопросы `кто`, `что`, `почему`, `что было удалено`, `что заблокировало`;
- нет утечки secrets или raw bulky payloads.

Блокеры:

- если новый ledger всё ещё каскадно удаляется вместе с content entity;
- если destructive trace нельзя прочитать без догадок и reverse engineering from logs.

### Stage 4. Path migration and legacy fencing

Цель:

Перевести реальные operator entry points на unified contour и перестать подсовывать unsafe primary actions.

Что делаем:

- меняем primary entry points в UI на единый safe path;
- переводим media workspace, entity editor, delete assistant и cleanup center на unified action model;
- убираем из primary position те legacy destructive actions, которые считают граф иначе, чем новый contour;
- legacy/manual paths сохраняем только как clearly labeled fallback, где это ещё нужно по контракту;
- делаем picker hygiene parity:
  - marked objects уходят из normal selection flows;
  - если где-то остаются видимыми, то только как disabled/explicitly quarantined rows.

Критерии приёмки:

- оператор в обычном сценарии попадает в один canonical cleanup path;
- UI не даёт ложный сигнал `не используется`, если surviving graph реально существует;
- marked entities не предлагаются как обычные relation targets;
- legacy/manual delete больше не торчит как равноценный primary action там, где unified contour уже покрывает сценарий.

Блокеры:

- если media/library UI по-прежнему считает usage отдельно от destructive truth;
- если hot destructive UI still routes into old helper family by default.

### Stage 5. Entity parity and policy normalization

Цель:

Добиться полного lifecycle parity для всех реальных entity types и убрать оставшиеся policy gaps.

Что делаем:

- доводим parity для `equipment` во всех destructive и usage contours;
- доводим parity между:
  - delete blockers
  - live deactivation blockers
  - sweep analyzer
  - teardown analyzer
  - media archive/orphan logic
- выравниваем policy wording и operator semantics на всех surfaces;
- отдельно проверяем shared-node behavior, чтобы система не удаляла reused assets или collections по соседству с marked graph.

Критерии приёмки:

- нет entity type, который участвует в read-side/admin/public contour, но не поддержан в destructive parity;
- shared nodes сохраняются, если живой unmarked contour продолжает на них ссылаться;
- `equipment` больше не является forgotten source type в blockers и usage.

Блокеры:

- если хотя бы один entity type остаётся “first-class in public/admin, second-class in delete safety”; 
- если policy differs across delete vs deactivation vs usage views without explicit contract reason.

### Stage 6. Verification matrix and live acceptance

Цель:

Доказать, что новый unified contour не только красив по архитектуре, но и устойчив технически.

Что делаем:

- вводим verification matrix по классам сценариев:
  - isolated deletable object
  - unmarked incoming blocker
  - shared node preservation
  - marked closed graph
  - mixed graph with surviving live refs
  - review residue blocker
  - open obligation blocker
  - media usage parity
  - deleted-entity forensic reconstruction
  - blocked destructive attempt forensic trace
- закрываем test gaps по `equipment` и complex graph scenarios;
- прогоняем Playwright/Web GUI acceptance на bounded test graphs;
- проводим server-only acceptance pass на живом сервере с test-marked data и обязательной уборкой.

Критерии приёмки:

- unit/integration tests green;
- UI smoke green;
- live server подтверждает expected graph behavior на сложном сценарии;
- forensic reconstruction подтверждена после реального удаления test graph.

Блокеры:

- если хотя бы один destructive path подтверждён только локально, но не доказан на сервере;
- если серверный acceptance показывает расхождение между UI verdict и фактическим execution result.

### Stage 7. Delivery, rollout, and post-deploy watch

Цель:

Довезти изменения на git и сервер без деградации production contour.

Что делаем:

- поставляем изменения small staged slices, а не одним big bang;
- после каждой delivery wave выполняем:
  - build
  - relevant tests
  - admin smoke
  - destructive-flow smoke на test-marked entities
  - forensic trail smoke
- отдельно проверяем, что legacy fallback paths либо ещё работают честно, либо intentionally fenced;
- после финальной поставки проводим post-deploy watch по журналу destructive events и runtime anomalies.

Критерии приёмки:

- unified contour работает на сервере;
- нет регрессий в publish/read-side boundaries;
- нет повторного silent deletion или stale ref incident на test scenarios;
- post-deploy check не выявляет нового class drift.

Блокеры:

- если rollout требует неуправляемого big bang switch;
- если post-deploy smoke не может доказать forensic traceability и graph parity.

## 7. Что сознательно не делаем в этом рефакторинге

Этот план не должен незаметно превратиться в другой эпик.

Вне текущего refactor scope:

- переписывание public launch canon;
- смена route ownership модели;
- автоматический auto-unpublish on mark как новая product truth без отдельного contract decision;
- полный отказ от specialized test teardown до доказанного parity shared engine;
- массовая product-level redesign of admin UI beyond destructive contour;
- arbitrary broad background cleanup automation.

## 8. Рекомендуемая последовательность исполнения

Практически безопасный порядок такой:

1. Stage 0
2. Stage 1
3. Stage 3 design spike for ledger carrier
4. Stage 2
5. Stage 3 implementation
6. Stage 4
7. Stage 5
8. Stage 6
9. Stage 7

Почему так:

- без Stage 1 нельзя честно свести пути в единый execution contour;
- без решения Stage 3 мы рискуем снова встроить delete logging в носитель, который умрёт вместе с entity;
- Stage 4 имеет смысл только после того, как unified contour уже реально готов;
- Stage 6 нельзя превращать в формальность после кодинга, он должен доказать новый contour.

## 9. Главные технические риски

1. Попытка сначала переподключить UI, а потом чинить domain layer.
2. Попытка встроить delete logging в старый entity-scoped cascade-bound audit store без отдельного ledger contract.
3. Сведение `test-graph-teardown` в shared system слишком рано и без policy isolation.
4. Частичная миграция, при которой media usage inventory и delete blockers продолжают считать разные графы.
5. Недооценка `equipment` как real operational entity type.
6. Big bang replacement legacy delete без runtime confidence.

## 10. Definition of done

Рефакторинг можно считать завершённым только если одновременно верны все условия:

- один canonical graph kernel реально владеет destructive reference truth;
- hot destructive paths больше не живут на локальных graph maps;
- destructive operations проходят через единый orchestration contour;
- every successful destructive mutation and every blocked destructive attempt leaves stable forensic trace;
- forensic trace survives hard delete of the original entity;
- media usage/orphan/archive views согласованы с delete safety model;
- `equipment`, `media_asset`, `gallery`, `service`, `case`, `page` имеют parity в destructive safety contour;
- primary operator UI routes into the unified path;
- server acceptance подтверждает реальную техническую устойчивость.

## 11. Final execution statement

Это не план “допилить удаление”.

Это план по переводу destructive lifecycle в архитектурно зрелое состояние:

- одна truth-модель графа;
- один execution contour;
- один reconstructable forensic след;
- controlled rollout без ослабления publish/read-side discipline.