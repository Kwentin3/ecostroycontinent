# ADMIN UI Post-Deploy Autonomous Review Plan for Экостройконтинент v0.1

Дата: 2026-03-29  
Тип: `playbook` / `autonomous review plan` / `post-deploy UX review`  
Назначение: план автономного ревью live-admin после deploy без расширения продуктового scope

## 1. Executive summary

Нужен не новый implementation-эпик, а жёсткий план ревью уже доставленного admin UI.  
Цель ревью: пройти все ключевые admin sub-screens как SEO/content operator, найти системные дефекты и отделить локальные баги от shared UI-проблем.

Этот план уже учитывает текущие наблюдения:

- встречаются битые подписи и кракозябры в отдельных CTA и label;
- правая панель на ряде экранов выходит за viewport и ломает ритм;
- центральный блок `Рабочая карточка` местами раздувается при низкой полезности;
- есть риск дублирования смысла между центральной колонкой и правой панелью;
- эти проблемы выглядят сквозными, а не локальными для одного route.

## 2. Primary question

Насколько текущая админка после deploy остаётся operator-first инструментом, а где она распадается на:

- битый текст;
- неудобный layout;
- дублирование смыслов;
- визуальный шум;
- бесполезные или раздувшиеся блоки.

## 3. Review scope

В ревью входят:

- `/admin`
- list surfaces: `service`, `case`, `page`, `media_asset`, `gallery`
- editor surfaces: `service`, `case`, `page`, `global_settings`
- `review`
- `publish`
- `history`
- `media workspace`
- shared layout and shared components, если дефект повторяется на нескольких маршрутах

В ревью не входят:

- новый page builder;
- public-site redesign;
- новые readiness semantics;
- новые evidence semantics;
- новый relation model;
- архитектурные переписывания;
- broad visual redesign ради красоты.

## 4. Review invariants

Ревью должно проверять интерфейс как рабочее место оператора, а не как набор схем и статусов.

Обязательные инварианты:

- текст в UI читается нормально, без mojibake и без случайных англицизмов;
- правая панель не выходит за экран и не ломает layout;
- центр и правая панель не дублируют одно и то же без явной пользы;
- крупный центральный блок оправдан по полезности, а не занимает место формально;
- empty, partial, blocked и fallback states не выглядят здоровыми;
- оператор может понять, куда смотреть и что исправлять, не читая интерфейс дважды.

## 5. Review outputs

После прохода ревью должен быть готов один отчёт в `docs/reports/YYYY-MM-DD/`.

Ожидаемый формат финального ревью-отчёта:

- `EXECUTIVE SUMMARY`
- `SYSTEMIC FINDINGS`
- `SCREEN-BY-SCREEN FINDINGS`
- `SHARED COMPONENT FINDINGS`
- `SEVERITY SPLIT`
- `FIX STRATEGY`
- `STOP TRIGGERS`

Каждый finding должен содержать:

- `severity`
- `surface`
- `symptom`
- `why this matters`
- `local or systemic`
- `likely impact zone`

## 6. Autonomous execution chain

Проход ревью фиксированный. Не перескакивать между этапами, пока не собран proof текущего pass.

### Pass 1. Text integrity and language pass

Задача:

- найти кракозябры;
- найти битый UTF-8;
- найти англицизмы в operator-facing текстах;
- проверить CTA, labels, badges, status chips, section titles, breadcrumbs, side panel headings.

Что проверять:

- заголовки экранов;
- primary and secondary buttons;
- chips and badges;
- evidence rows;
- readiness panel;
- relation chips;
- right panel labels;
- empty/fallback copy.

Binary result:

- либо текст нормален и понятен;
- либо finding фиксируется как `text / encoding / copy`.

### Pass 2. Layout containment and right-rail pass

Задача:

- проверить правую панель на overflow;
- проверить разнобой размеров;
- проверить вертикальный ритм и внутренний scroll;
- проверить узкие viewport widths.

Обязательные viewport checkpoints:

- `1440`
- `1280`
- `1024`
- `768`

На каждом checkpoint проверить:

- не обрезается ли правая панель;
- не выходит ли контент за viewport;
- читаются ли chips, buttons и headings;
- не ломается ли scroll;
- не уезжают ли CTA за пределы контейнера.

Binary result:

- либо панель contained and readable;
- либо finding фиксируется как `layout / responsiveness / overflow`.

### Pass 3. Center vs right-panel role separation pass

Задача:

- проверить, есть ли у центра и правой панели разные роли;
- найти дублирование функций, статусов, объяснений и action cues;
- понять, читает ли оператор один и тот же смысл дважды.

Обязательные вопросы на каждом editor screen:

- что делает центр;
- что делает правая панель;
- дублируют ли они состояние;
- дублируют ли они следующий шаг;
- дублируют ли они доказательства;
- если убрать один блок, потеряется ли смысл.

Binary result:

- либо роли разделены;
- либо finding фиксируется как `information architecture / duplication`.

### Pass 4. Utility and density pass

Задача:

- проверить большие центральные блоки на реальную пользу;
- найти блоки, которые занимают много места и мало помогают оператору;
- отделить полезный summary от “большой карточки ради карточки”.

Особый фокус:

- блок `Рабочая карточка`;
- oversized explanations;
- long neutral copy above the form;
- повтор того, что уже видно в status / evidence / readiness.

Binary result:

- либо блок оправдан по operator utility;
- либо finding фиксируется как `information density / low utility`.

### Pass 5. Shared-component propagation pass

Задача:

- определить, какие дефекты сквозные и идут из shared components;
- не плодить локальные findings, если причина одна и та же.

Сначала маппинг на shared zones:

- `AdminShell`
- `EntityEditorForm`
- `EntityActionabilityPanel`
- `ReadinessPanel`
- `EvidenceRegisterPanel`
- `RelationChipRow`
- shared CSS modules
- list row/card rendering

Правило:

- если один и тот же симптом повторяется на трёх и более экранах, классифицировать его как systemic, а не как набор разрозненных багов.

### Pass 6. Severity and fix-envelope pass

Задача:

- разложить findings по severity;
- отделить patch-level fixes от cases, где нужен owner decision;
- подготовить fix envelope для следующего implementation pass.

Severity contract:

- `blocker` - мешает пользоваться surface или искажает смысл;
- `serious` - сильно ухудшает operator flow, но не делает экран unusable;
- `minor` - раздражает, портит доверие или читабельность, но не блокирует сценарий.

## 7. Screen matrix

Ревью проходит по следующей матрице.

### Core operator entry

- `/admin`

Проверить:

- cockpit copy;
- next action readability;
- layout balance;
- entry points to evidence and entity work.

### Entity lists

- `/admin/entities/service`
- `/admin/entities/case`
- `/admin/entities/page`
- `/admin/entities/media_asset`
- `/admin/entities/gallery`

Проверить:

- row readability;
- readiness / gap signals;
- button labels;
- header actions;
- list empty states;
- text integrity.

### Entity editors

- `/admin/entities/service/new` and one existing `service`
- one `case`
- one `page`
- `global_settings`

Проверить:

- top block usefulness;
- `Рабочая карточка`;
- truth sections;
- right panel;
- evidence surface;
- relation summary;
- primary action hierarchy.

### Workflow surfaces

- one `review`
- one `publish`
- one `history`

Проверить:

- readability of status and actions;
- duplication vs editor surface;
- fallback labels;
- panel containment.

### Media surfaces

- one media workspace
- one gallery/collection surface

Проверить:

- chips and labels;
- side panel containment;
- non-healthy states;
- no broken text in toolbar and actions.

## 8. Evidence package for the review

Для автономного ревью нужно собрать одинаковый proof package.

Минимум:

- по одному скриншоту на каждый screen family;
- отдельные screenshots для каждого системного дефекта;
- один narrow viewport proof на editor surface;
- notes по route и viewport;
- список повторяющихся симптомов;
- mapping `symptom -> likely shared component`.

Обязательные screenshot categories:

- text/encoding issue;
- right-rail overflow;
- oversized low-utility center block;
- duplicated center/right content;
- one healthy screen for contrast.

## 9. Stop triggers

Ревью должно остановиться и эскалировать, если:

- проблема не локальная UI, а требует изменения канона;
- невозможно понять, что является source of truth между центром и правой панелью;
- дефект на самом деле вызван server/runtime inconsistency, а не UI;
- исправление очевидно требует нового product decision, а не UX cleanup;
- для классификации приходится изобретать новые readiness/evidence/relation semantics.

## 10. Acceptance criteria for the review itself

Ревью считается выполненным, если:

1. Пройдены все route families из screen matrix.
2. Проверены все четыре viewport widths для хотя бы одного editor screen и одного list screen.
3. Каждый finding классифицирован как `local` или `systemic`.
4. Каждый systemic finding привязан к likely shared impact zone.
5. Нет findings в стиле “в целом неудобно” без конкретного симптома.
6. Для каждого serious/blocker finding есть screenshot proof.
7. Есть отдельный раздел про дублирование центра и правой панели.
8. Есть отдельный раздел про текст/кодировку/англицизмы.
9. Есть отдельный раздел про responsiveness правой панели.
10. Есть fix envelope, по которому можно открыть автономный bugfix pass.

## 11. Recommended final report naming

Для итогового отчёта по этому ревью использовать:

`ADMIN_UI_POST_DEPLOY_SYSTEMIC_REVIEW_Экостройконтинент_v0.1.report.md`

## 12. Definition of done

План готов к автономному исполнению, если по нему можно пройти ревью без новых owner decisions и без размытых формулировок.

На выходе из ревью должно быть ясно:

- какие defects локальные;
- какие defects системные;
- какие components/routes они затрагивают;
- что можно чинить shared patch'ем;
- где нужен отдельный owner decision по роли центра и правой панели.
