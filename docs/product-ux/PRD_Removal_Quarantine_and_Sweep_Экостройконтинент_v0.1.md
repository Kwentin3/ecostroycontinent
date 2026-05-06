# PRD Removal Quarantine and Sweep Экостройконтинент v0.1

Проект: «Экостройконтинент»  
Версия: v0.1  
Статус: draft / working product doc / parallel admin contour  
Основание: [PRD_Экостройконтинент_v0.3.1.md](./PRD_Экостройконтинент_v0.3.1.md), [Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md](./Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md), [Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md](./Workflow_Publish_Revision_Spec_Экостройконтинент_v0.1.md), [Removal_Quarantine_and_Sweep_Contract_Pack_Экостройконтинент_v0.1.md](./Removal_Quarantine_and_Sweep_Contract_Pack_Экостройконтинент_v0.1.md)

## 1. Purpose and why now

Текущий механизм безопасного удаления защищает published truth и связанные графы корректно, но операторский опыт остаётся слишком системным и контринтуитивным.

Сегодня для удаления одного `Case` или другого узла, который удерживается опубликованной `Service`, оператору приходится вручную проходить цепочку:

- открыть внешний объект;
- убрать relation;
- сохранить черновик;
- отправить новую ревизию на проверку;
- открыть review/publish flow;
- опубликовать новую версию;
- вернуться назад к исходному удалению.

С точки зрения модели revisions/publish это логично. С точки зрения человека это неудобно, неочевидно и плохо соответствует пользовательскому intent «убрать объект безопасно».

Нужен новый параллельный контур удаления, который:

- не ослабляет текущую safety-модель;
- не ломает `Draft -> Review -> Published`;
- не требует от оператора вручную разматывать граф зависимостей в голове;
- превращает удаление в более человеческий `mark -> analyze -> sweep` flow.

## 2. Product decision

В проект вводится новый параллельный контур удаления:

- `Пометить на удаление` / removal quarantine;
- отдельный системный экран `Удалить объекты, помеченные на удаление`;
- dependency-aware sweep, который удаляет только те компоненты, которые система признала безопасными.

Новый контур в v0.1 не заменяет существующий delete mechanism полностью.

Существующий flow сохраняется как legacy/manual fallback path:

- для edge-cases;
- для несопровождаемых типов;
- для сценариев, где новый sweep ещё не покрывает нужную политику.

## 3. Problem statement

### 3.1 Current operator pain

Текущий delete UX неудобен не потому, что правила неправильные, а потому, что внутренняя publish/revision-модель слишком сильно торчит наружу.

Оператор хочет выполнить одну задачу:

- убрать объект безопасно.

Система требует мыслить внутренними стадиями:

- draft state;
- review submission;
- explicit publish;
- published incoming refs;
- state blockers;
- live deactivation.

Это создаёт ощущение, что оператор не пользуется фичей удаления, а вручную разыгрывает внутреннюю state machine системы.

### 3.2 Real domain problem

Удаление в домене Экостройконтинента сложно не само по себе, а из-за сочетания двух факторов:

- граф связей между `Service`, `Case`, `MediaAsset`, `Gallery` и другими сущностями;
- explicit publish/read-side semantics.

Система обязана предотвращать:

- висящие входящие ссылки на уже удалённый объект;
- surviving published graph, который всё ещё зависит от удалённого узла;
- разрушение route-owning published truth;
- рассинхрон review/publish obligations;
- частичное удаление дерева без честной диагностики блокеров.

## 4. Goals

### 4.1 Primary goals

- Дать оператору понятный и человеко-ориентированный путь удаления через `mark -> analyze -> sweep`.
- Вывести объекты-кандидаты на удаление из обычного рабочего оборота до hard delete.
- Запретить новые ссылки на объекты, помеченные на удаление.
- Автоматически находить компоненты удаления и удалять только безопасные компоненты.
- Явно показывать, какой именно живой внешний объект блокирует purge.
- Сохранить строгую publish/read-side safety discipline.
- Сохранить auditability всех destructive действий.

### 4.2 Secondary goals

- Снизить число ручных переходов между экранами и внутренними state-механиками.
- Сделать cleanup historical/proof/test-like хвостов дешевле и понятнее.
- Подготовить почву для более широкого cleanup tooling без немедленного снятия legacy path.

## 5. Non-goals for v0.1

- Полная замена текущего delete/manual flow.
- Скрытая автоматическая перепубликация чужих live-сущностей без явного подтверждения.
- Массовый background cleanup как основной пользовательский сценарий.
- Удаление объектов, которые не были явно помечены на удаление.
- Автоматическое ослабление publish, review, owner approval или obligation contracts.
- Немедленное распространение на все возможные entity types без bounded rollout.

## 6. Scope

### 6.1 In scope for v0.1

Первый rollout нового контура покрывает приоритетные graph-heavy типы:

- `Service`
- `Case`
- `MediaAsset`
- `Gallery`

Поддержка `Page` и других типов может быть добавлена позже отдельной волной после подтверждения policy parity и UX-value.

### 6.2 Explicitly out of scope for v0.1

- `GlobalSettings`
- broad archive platform
- silent background purge
- автоматическое массовое авто-unpublish всего marked-набора при постановке метки

## 7. Users and permissions

### 7.1 Mark / unmark

Право помечать и снимать пометку получают роли, которые уже имеют право редактировать контент соответствующей сущности.

### 7.2 Sweep execution

В v0.1 право запускать destructive sweep должно быть уже, чем право mark/unmark. Базовый безопасный выбор:

- `Superadmin` executes purge.

Расширение на другие publish-capable роли возможно позже, если это не ослабляет destructive safety.

## 8. Core product principles

### 8.1 Mark is quarantine, not delete

`Помечен на удаление` не означает, что объект уже можно удалить. Это означает, что объект переведён в карантин удаления и становится кандидатом на cleanup sweep.

### 8.2 Marked objects leave normal write-side circulation

После mark объект:

- не должен предлагаться как нормальный target в relation picker'ах;
- не должен принимать на себя новые ссылки;
- должен быть явно виден как removal candidate в editor/list/system surfaces.

### 8.3 Safety is defined by graph closure plus state closure

Компонент можно удалить не просто потому, что он marked, а только если одновременно выполнены оба условия:

- graph-safe: нет входящих ссылок из unmarked-контура;
- state-safe: нет review/publish/lifecycle blockers.

### 8.4 `unmarked -> marked` is the main blocker

Главный блокирующий инвариант:

- живой непомеченный объект не может использовать marked object.

### 8.5 `marked -> unmarked` is not automatically a blocker

Если marked graph ссылается на живой unmarked объект, но у живого объекта нет обратной зависимости на marked graph, такой reference сам по себе purge не блокирует.

### 8.6 Legacy delete remains as fallback

Существующий delete flow не исчезает сразу. Он остаётся как legacy/manual path, пока новый контур не докажет покрытие нужных operator scenarios.

## 9. Domain model

### 9.1 Persisted removal fields

Для каждой поддерживаемой сущности вводятся минимальные persisted поля removal quarantine:

- `markedForRemovalAt`
- `markedForRemovalBy`
- `removalNote` (optional)

Этого достаточно для v0.1, если readiness/blocking/ready states считаются на лету анализатором.

### 9.2 Derived removal statuses

UI и analyzer работают с производными статусами:

- `not_marked`
- `marked`
- `marked_blocked`
- `marked_ready_for_purge`
- `purged`

В v0.1 допускается не хранить `marked_blocked` и `marked_ready_for_purge` в БД как source fields, а вычислять их динамически.

### 9.3 Relation to published state

`marked_for_removal` и `published/unpublished` — разные оси состояния.

Принцип для v0.1:

- пометка на удаление не гарантирует немедленный `unpublished`;
- если объект всё ещё удерживается внешним live-контуром, UI должен честно показывать: `помечен на удаление, но ещё удерживается живым контуром`;
- безопасный auto-unpublish может быть добавлен позже как расширение, но не является обязательным baseline в этом PRD.

## 10. UX surfaces

### 10.1 Entity editor

На editor screen появляется primary lifecycle action:

- `Пометить на удаление`

Если объект уже marked:

- `Снять пометку удаления`
- видимый статус `Помечен на удаление`
- краткое пояснение, что объект выведен из обычного оборота и ждёт cleanup evaluation.

### 10.2 Entity registry / lists

В registry и lists:

- marked objects visually labelled;
- доступны filters типа `Только помеченные на удаление`;
- состояние marked не маскируется как ordinary draft/published row.

### 10.3 Relation pickers

Marked objects:

- либо скрыты из picker'ов полностью;
- либо показываются disabled с явной пометкой `Помечен на удаление`.

Сохранение новой ссылки на marked object должно блокироваться validation-layer'ом, даже если объект каким-то образом попал в payload.

### 10.4 System menu screen

В системном меню появляется новый bounded entrypoint:

- `Удалить объекты, помеченные на удаление`

Этот экран — главный operational center нового контура.

### 10.5 Legacy/manual path labeling

Существующий current delete flow остаётся доступным, но маркируется явно как:

- `Legacy: ручное безопасное удаление`
- или эквивалентный wording, который честно говорит, что это manual fallback path.

## 11. Main flows

### 11.1 Mark object

1. Оператор открывает сущность.
2. Нажимает `Пометить на удаление`.
3. Система записывает removal mark и audit event.
4. Объект получает visible quarantine state.
5. Новые ссылки на него становятся запрещёнными.

### 11.2 Unmark object

1. Оператор снимает пометку.
2. Система возвращает объект в обычный оборот.
3. Audit trail фиксирует снятие пометки.

### 11.3 Analyze marked components

1. Оператор открывает экран `Удалить объекты, помеченные на удаление`.
2. Система строит компоненты удаления из marked objects.
3. Для каждой компоненты система вычисляет:
   - состав marked members;
   - входящие ссылки из unmarked entities;
   - outgoing refs наружу;
   - review blockers;
   - publish obligations;
   - live/published blockers;
   - purge verdict.

### 11.4 Purge ready component

Если компонент safe:

1. система показывает точный summary;
2. оператор подтверждает purge один раз на компонент;
3. система исполняет dependency-aware cleanup order;
4. все удалённые объекты получают audit trace;
5. экран пересчитывается.

### 11.5 Blocked component

Если компонент не safe:

1. система не выполняет purge;
2. показывает точный blocker;
3. показывает, какой именно unmarked объект или state condition держит граф;
4. не заставляет оператора угадывать порядок вручную.

## 12. Sweep decision rules

### 12.1 Ready component

Компонент marked objects считается `ready_for_purge`, если:

- все узлы компонента marked;
- нет входящих ссылок из unmarked objects;
- нет review revisions внутри компонента;
- нет открытых publish obligations, которые блокируют lifecycle;
- нет policy-blockers на hard delete для поддерживаемых типов;
- route-owning published truth внутри компонента может быть safely removed as part of purge path.

### 12.2 Blocked component

Компонент считается `blocked`, если есть хотя бы одно из:

- `unmarked -> marked` incoming ref;
- review residue;
- open publish obligations;
- protected lifecycle policy;
- unsupported entity type внутри purge path;
- другой surviving operational blocker.

### 12.3 Allowed outgoing refs

`marked -> unmarked` outgoing ref допускается, если:

- unmarked object не зависит обратно на marked component;
- purge marked component не ломает surviving truth объекта-назначения.

## 13. Purge execution semantics

### 13.1 No silent destructive sweep

Даже если компонент safe, purge не должен идти без хотя бы одного явного финального подтверждения на компонент или bounded batch.

### 13.2 Dependency-aware order

Удаление выполняется в безопасном порядке:

- сначала те узлы, которые держат внутренние зависимости;
- затем deeper dependencies;
- published truth снимается из live only as part of safe purge sequence, если policy это разрешает.

### 13.3 No purge of unmarked objects

Sweep никогда не удаляет unmarked object автоматически только потому, что он лежит рядом в графе.

## 14. Relationship to current workflow contracts

Новый контур не отменяет существующие contracts:

- `Draft -> Review -> Published`
- explicit publish
- publish obligations
- route ownership
- live deactivation semantics

Он добавляет поверх них новый operator-friendly cleanup contour.

Это означает:

- removal quarantine — это не shortcut вокруг publish discipline;
- sweep может пользоваться существующими safe capabilities;
- но он не должен ослаблять read-side/write-side boundaries.

## 15. Relationship to existing delete tools

### 15.1 Current safe removal assistant

Существующий `Безопасно убрать объект` остаётся:

- как bounded manual path;
- как fallback для unsupported situations;
- как legacy/manual delete tool.

### 15.2 Existing test graph teardown

Существующий `Удалить тестовый граф` не исчезает и не смешивается автоматически с новым контуром.

Новый quarantine+sweep mechanism — более общий operator cleanup path. Специальный test teardown remains a distinct specialized capability until later convergence is explicitly designed.

## 16. Success criteria

Фича считается успешной, если:

- оператор может помечать и снимать пометку удаления без обходных путей;
- marked objects больше не принимают новые ссылки;
- новый system screen честно разделяет `ready` и `blocked` components;
- blocked component показывает точный blocker object/state, а не абстрактное `нельзя удалить`;
- safe component можно удалить одним bounded confirm, без ручного разматывания всей цепочки по экранам;
- no dangling refs are introduced;
- publish/read-side safety не деградирует;
- legacy/manual path остаётся доступным как fallback.

## 17. Example operator scenarios

### 17.1 One marked case still used by live service

- `Case` marked for removal.
- `Service` not marked and still published.
- Analyzer finds `unmarked Service -> marked Case`.
- Verdict: `blocked`.
- UI must show exact blocker service.
- Purge must not execute.

### 17.2 Whole proof graph marked and isolated

- `Service`, related `Case`, `Gallery`, `MediaAsset` all marked.
- No incoming refs from unmarked contour.
- No review residue, no open obligations.
- Verdict: `ready_for_purge`.
- One confirm removes the whole component in safe order.

### 17.3 Marked graph refers to shared live media host or surviving object

- marked graph points to an unmarked object;
- but unmarked object does not depend on the marked graph.

Verdict may still be `ready`, if no reverse dependency and no state blocker exists.

## 18. Rollout posture

### 18.1 Parallel contour

Внедрение идёт как parallel contour.

Это означает:

- новый cleanup path добавляется рядом;
- старый path пока не выпиливается;
- deprecation legacy delete откладывается до накопления runtime confidence.

### 18.2 Bounded first release

Первый release intentionally narrow:

- supported entity types are bounded;
- no broad automation beyond safe sweep;
- no hidden republish magic;
- no immediate removal of legacy UX.

## 19. Open decisions explicitly deferred

Эти темы сознательно не считаются закрытыми в v0.1:

- should mark attempt immediate safe auto-unpublish for eligible published objects;
- should purge confirm be per-component or multi-component batch;
- when `Page` joins the same contour;
- whether test-graph teardown later folds into the same sweep engine.

## 20. Final product statement

Экостройконтиненту нужен не «ещё один экран удаления», а отдельный operator cleanup contour.

Каноническая модель этого PRD:

- `mark first` instead of immediate hard delete;
- marked objects leave normal write-side circulation;
- new incoming refs to marked objects are forbidden;
- system menu exposes one cleanup center;
- sweep deletes only safe closed marked components;
- exact blockers are shown when safe purge is impossible;
- current delete flow survives as legacy/manual fallback until the new contour proves itself.

