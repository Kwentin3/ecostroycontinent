# PLAN.EQUIPMENT_SERVICE_LANDING_UI.REMEDIATION.V1.report

## 1. Purpose

Этот план продолжает аудит `AUDIT.ANAMNESIS.EQUIPMENT_SERVICE_LANDING_UI.V1.report.md` и переводит выводы в практический backlog:

- что доделывать;
- что рефакторить;
- в каком порядке это делать;
- какие решения я считаю правильными;
- каких решений я бы избегал.

Цель плана не в том, чтобы "сделать page builder богаче вообще", а в том, чтобы довести продукт до рабочего сценария:

`SEO-специалист собирает landing page услуги по технике, используя карточки техники как один из основных источников контента.`

## 2. Current Diagnosis

По факту сейчас в продукте есть две разные логики, которые живут рядом, но не складываются в один рабочий сценарий:

1. `Page workspace`
   - аккуратный редактор статических страниц;
   - заточен под `about / contacts`;
   - имеет собственный composition model, metadata modal, preview, bounded AI и review handoff.

2. `Service landing` tooling
   - живёт в `service` flow;
   - имеет отдельную factory / memory / verification механику;
   - не является каноническим page workflow для SEO-оператора.

Из-за этого сейчас не хватает не только фич, но и архитектурного выбора:

- кто канонически владеет landing page под технику;
- где живёт truth;
- где оператор должен начинать сценарий;
- какая сущность является источником техники;
- как preview должен собирать реальную публичную страницу.

## 3. My Core Position

### 3.1 Что я рекомендую

Я рекомендую не строить третий параллельный поток и не раздувать static-page editor до универсального конструктора всего подряд.

Правильнее выбрать один из двух путей и зафиксировать его как canonical:

1. либо `Page` становится first-class доменом для commercial service landings;
2. либо `Service` остаётся каноническим владельцем service landing, а `page`-слой перестаёт быть конкурирующим редактором и становится downstream/public projection.

### 3.2 Что я не рекомендую

Я бы не делал следующее:

- не добавлял `equipment` только как ещё один picker в текущий page workspace без доменного пересмотра;
- не дублировал landing-логику и в `Page`, и в `Service`;
- не пытался лечить проблему только AI-панелью;
- не строил свободный page builder как substitute for domain model;
- не маскировал отсутствие shell preview косметикой.

### 3.3 Моя предпочтительная развилка

Если ориентироваться именно на SEO/operator workflow, я бы выбрал такой вектор:

- `equipment` становится first-class source entity;
- `service landing` становится каноническим типом коммерческой посадки;
- редактирование идёт через единый workspace;
- page/public renderer строится как projection этого домена, а не как отдельная competing truth-model.

Причина простая: сейчас самая опасная проблема не в бедности UI, а в риске получить два редактора, которые умеют почти одно и то же, но расходятся по смыслу и данным.

## 4. Target State

После remediation продукт должен давать SEO-специалисту такой путь:

1. найти или создать landing под технику;
2. выбрать одну или несколько карточек техники;
3. подтянуть ключевые данные, медиа и proof;
4. собрать hero, offer, geo, proof, FAQ, CTA;
5. видеть real-shell preview с header/footer;
6. пройти readiness / review без похода в код;
7. клонировать и адаптировать страницу под другую технику или гео;
8. не терять контроль над inherited vs overridden content.

## 5. Workstreams

## 5.1 Workstream A — Domain Alignment

### Goal

Убрать конфликт между `page workspace` и `service landing tooling` и выбрать один канонический путь для equipment-service landing.

### P0 tasks

1. Зафиксировать canonical owner для landing-сценария.
   Вариант A: owner = `page`.
   Вариант B: owner = `service`.
   Вариант C: `service` owns landing semantics, `page` owns public routing/public shell only.

2. Описать truth boundaries.
   Нужно письменно определить:
   - где лежит коммерческий оффер;
   - где лежит SEO-слой;
   - где лежат source links;
   - где лежат derived/public artifacts;
   - где оператор редактирует страницу ежедневно.

3. Убрать двойную конкуренцию между page-flow и service-flow.
   Если landing остаётся в `service`, `page workspace` не должен выглядеть как второй landing editor.
   Если landing переезжает в `page`, service factory не должен остаться параллельным редактором.

### Deliverables

- ADR или product-tech note с выбором canonical owner;
- карта ownership по сущностям и derived artifacts;
- список legacy pieces, которые нужно свернуть или интегрировать.

### My remark

Это самый важный этап. Если его пропустить, команда быстро упрётся в "у нас есть два почти одинаковых инструмента, оба неполные, оба нужно поддерживать".

## 5.2 Workstream B — Content Model Refactor

### Goal

Добавить missing domain model для техники и коммерческого landing-а, а не пытаться собирать его из чужих сущностей.

### P0 tasks

1. Ввести first-class сущность `equipment` / `technique`.
   Минимум в модели:
   - title;
   - slug;
   - type/category;
   - primary media;
   - gallery/media set;
   - характеристики;
   - сценарии использования;
   - преимущества;
   - связки с кейсами;
   - service-area relevance или пригодность по гео.

2. Ввести landing-oriented page type.
   Минимум:
   - `service_landing`;
   - при необходимости `equipment_landing`;
   - при необходимости `geo_service_landing`.

3. Развести source-of-truth и projection fields.
   Должно быть понятно:
   - что inherited from equipment;
   - что inherited from service;
   - что page-owned;
   - что overridden.

### P1 tasks

1. Добавить section model для commercial page.
   Минимум:
   - hero / offer;
   - equipment summary;
   - advantages;
   - service area;
   - proof / cases;
   - FAQ;
   - how to order / CTA.

2. Добавить override-policy.
   Для каждого блока нужно понимать:
   - synced;
   - manually edited;
   - detached from source.

### Refactor notes

- `PAGE_TYPES` и page schema сейчас слишком узкие; это не просто feature gap, это hard domain constraint.
- `ENTITY_TYPES` без `equipment` удерживает весь UI в ложной модели.
- Сначала меняем модель, потом UI. Не наоборот.

### My remark

Я бы не подменял `equipment` сущностью `service`. Это даёт ложную краткосрочную экономию, но потом ломает и SEO-смысл, и редакторский ментальный модель.

## 5.3 Workstream C — Workspace Refactor

### Goal

Перестроить editing surface так, чтобы SEO-специалист работал не с "текстом и ссылками вообще", а с коммерческой посадкой.

### P0 tasks

1. Поменять create flow.
   На входе должны появиться:
   - тип landing-а;
   - source basis: техника, услуга, гео;
   - начальная заготовка;
   - route/slug strategy.

2. Добавить equipment/source picker.
   Нужно уметь:
   - выбрать одну карточку техники;
   - выбрать несколько;
   - увидеть, что уже прикреплено;
   - быстро перейти к карточке источника.

3. Перестроить sections в workspace.
   Вместо current narrow sequence должны быть отдельные управляемые секции:
   - first screen;
   - source blocks;
   - geo block;
   - proof block;
   - FAQ;
   - CTA;
   - service flow / order path.

### P1 tasks

1. Добавить reorderable narrative blocks.
2. Добавить section completeness hints.
3. Добавить inline indicators:
   - inherited;
   - manually edited;
   - outdated relative to source.

### P2 tasks

1. Сделать theme/visual controls более видимыми.
2. Упростить переход между source pickers и активными блоками страницы.

### Refactor notes

- `PageWorkspaceScreen` сейчас архитектурно честный, но слишком жёстко прибит к static-page composition.
- Его лучше не "латать" мелкими if-ветками под технику, а выделить более общий commercial-landing composition layer.
- Если оставить текущую форму и просто нарастить поля, получится тяжёлый и хрупкий монолит.

### My remark

Я бы пошёл не в универсальный drag-and-drop builder, а в structured editor с сильными секциями и понятным смыслом. Для SEO-оператора это почти всегда лучше и безопаснее.

## 5.4 Workstream D — Preview Refactor

### Goal

Сделать preview инструментом принятия редакторских решений, а не только визуальной проверкой copy/theme.

### P0 tasks

1. Включить real public shell в preview.
   Нужно показывать:
   - header;
   - hero under header;
   - body flow;
   - footer.

2. Добиться parity между workspace preview и review/public rendering.

3. Показать readiness markers прямо рядом с preview.
   Например:
   - нет гео;
   - нет proof;
   - слабый first screen;
   - не выбрано главное изображение;
   - нет CTA.

### P1 tasks

1. Добавить meaningful mobile/tablet/desktop checks.
2. Добавить preview toggles для важного окружения:
   - shell on/off;
   - published-like mode;
   - geo/meta debug overlay.

### Refactor notes

- `StandalonePage` для текущих static pages нормален, но для commercial landing scenario этого уже недостаточно.
- Preview должен быть не вторичной декорацией, а частью editorial workflow.

### My remark

Пока preview не показывает реальную страницу, оператор вынужден принимать решения вслепую. Это дорогая слепота, особенно для first screen.

## 5.5 Workstream E — SEO / Geo / Proof Layer

### Goal

Закрыть именно SEO-операторские боли, а не только редакторскую форму.

### P0 tasks

1. Ввести geo model.
   Минимум:
   - город;
   - район;
   - зона выезда;
   - service area summary;
   - geo modifiers for title/H1/meta.

2. Ввести proof-content model.
   Минимум:
   - характеристики техники;
   - для каких задач подходит;
   - кейсы;
   - доверительные тезисы;
   - сценарии использования.

3. Ввести SEO structure guardrails.
   Проверки:
   - есть ли H1;
   - не дублируется ли intent;
   - есть ли geo modifier;
   - есть ли proof;
   - есть ли CTA;
   - не получилась ли "простыня без структуры".

### P1 tasks

1. FAQ как first-class block.
2. "Как заказать" / "как проходит работа" как first-class block.
3. Базовые duplicate-risk warnings для серии похожих страниц.

### My remark

Это не второстепенный enhancement. Без этого инструмент может быть удобным визуально, но всё равно слабым как SEO-рабочее место.

## 5.6 Workstream F — Lifecycle and Series Production

### Goal

Сделать систему пригодной не для одной демонстрационной страницы, а для production-серии посадок.

### P0 tasks

1. Ввести clone/adapt flow.
   Оператор должен уметь:
   - клонировать страницу;
   - сменить технику;
   - сменить гео;
   - получить checklist уникализации.

2. Добавить lifecycle statuses, понятные для оператора.
   Например:
   - draft;
   - incomplete;
   - ready for review;
   - review blocked;
   - published;
   - outdated relative to source.

3. Показывать причину непубликуемости.

### P1 tasks

1. Ввести batch-friendly registry affordances:
   - duplication;
   - status filters;
   - geo/type filters;
   - source-linked filters.

2. Добавить source drift awareness.
   Если карточка техники изменилась, страница должна это показать.

### My remark

Если не сделать serial workflow сразу хотя бы в базовом виде, команда соберёт одну страницу красиво, а потом упрётся в ручной ад на десятой.

## 5.7 Workstream G — AI Panel Reframing

### Goal

Оставить AI полезным помощником, а не ложной компенсацией слабой модели.

### P1 tasks

1. Привязать AI к доменным секциям:
   - hero offer;
   - geo copy;
   - proof bridge;
   - CTA;
   - FAQ improvements.

2. Дать AI richer source context:
   - attached equipment;
   - selected geo;
   - proof/cases;
   - current stage of page.

3. Показывать, на чём основано предложение.

### What not to do

- не разрешать AI свободно переписывать всё подряд без секционного контекста;
- не превращать AI в second editor;
- не компенсировать через AI отсутствие proper section model.

### My remark

Сейчас AI technically present, но бизнес-ценность у него низкая, потому что он сидит поверх бедного контекста. Надо лечить не кнопку, а подложку.

## 6. Proposed Delivery Sequence

## Wave 1 — P0 Foundation

Сделать сначала:

1. canonical owner decision;
2. `equipment` entity;
3. landing page type;
4. section model для commercial page;
5. real-shell preview.

### Exit criteria

- можно создать landing под технику;
- можно прикрепить технику как source;
- можно собрать базовый commercial flow;
- можно увидеть реальную страницу в preview;
- можно отправить страницу на review как осмысленный landing, а не как static page workaround.

## Wave 2 — P1 Operator Usability

Дальше делать:

1. geo model;
2. proof/spec blocks;
3. inherited vs overridden indicators;
4. readiness checks;
5. duplicate-risk warnings;
6. richer registry filters.

### Exit criteria

- SEO-специалист может собрать локальную посадку;
- оператор понимает, что подтянуто, что переписано;
- продукт помогает, а не только разрешает редактировать.

## Wave 3 — P1/P2 Scale and Polish

Затем:

1. clone/adapt flow;
2. batch-friendly registry;
3. source drift awareness;
4. AI enrichment по секциям;
5. visual/theme discoverability polish.

### Exit criteria

- можно делать серию страниц без ручного ада;
- есть базовая защита от дублей и дрейфа;
- AI начинает реально ускорять работу.

## 7. Suggested Refactor Boundaries

### Refactor boundary 1 — Domain constants and schemas

Нужно пересмотреть:

- `lib/content-core/content-types.js`
- `lib/content-core/schemas.js`
- связанные readiness / normalization / pure functions

Это core-layer рефакторинг. Его надо делать осознанно и отдельно от cosmetic UI tweaks.

### Refactor boundary 2 — Workspace composition model

Нужно пересмотреть:

- `lib/admin/page-workspace.js`
- `lib/landing-workspace/landing.js`
- composition payload, preview payload, AI patch extraction

Сейчас тут виден жёсткий static-page bias. Его нельзя бесконечно расширять if-ветками.

### Refactor boundary 3 — Competing landing tooling

Нужно решить судьбу:

- `components/admin/PageWorkspaceScreen.js`
- `components/admin/ServiceLandingWorkspacePanel.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `app/api/admin/entities/service/landing-factory/generate/route.js`

Здесь я бы особенно аккуратно провёл consolidation, чтобы не оставить рядом две неполные парадигмы.

### Refactor boundary 4 — Public renderer and preview

Нужно пересмотреть:

- `components/public/PublicRenderers.js`
- preview assembly в admin/review routes

Без этого preview fidelity останется неполным.

## 8. Risks

1. **Риск ложной экономии**
   Если попытаться быстро "добавить ещё пару полей" в текущий page workspace, можно потратить спринт и не решить сценарий.

2. **Риск двойного truth**
   Если и `service`, и `page` будут хранить landing semantics параллельно, расхождения почти гарантированы.

3. **Риск UI-перегруза**
   Если сложить все missing features в одну форму без структурирования, редактор станет тяжёлым и пугающим.

4. **Риск недооценки preview**
   Если shell preview снова отложить, операторская слепота останется, даже при более богатой модели.

5. **Риск "сделали одну страницу, не сделали поток"**
   Без clone/adapt и duplicate guardrails решение не выдержит масштабирования.

## 9. Non-Goals

В рамках этой remediation-программы я бы явно не ставил такие цели:

- строить универсальный no-code page builder;
- делать визуальный редактор уровня Tilda/Webflow;
- полностью redesign всей админки;
- переписывать весь content platform за один заход;
- делать AI-first authoring вместо operator-first workflow.

## 10. Recommended Backlog Order

Если нужен короткий практический порядок, я рекомендую такой:

1. Принять canonical architecture decision: `page` vs `service`.
2. Добавить `equipment` entity.
3. Добавить landing-oriented content model и page type.
4. Пересобрать workspace вокруг structured sections.
5. Довести preview до real-shell fidelity.
6. Добавить geo/proof/spec/FAQ blocks.
7. Ввести inherited vs overridden и source drift indicators.
8. Добавить clone/adapt и batch workflow.
9. Уже после этого усиливать AI и polish.

## 11. Final Recommendation

Если говорить прямо, продукт сейчас ближе к хорошему static-page editor, чем к рабочему инструменту для SEO-сборки equipment service landing.

Поэтому мой совет такой:

- не лечить это точечными кнопками;
- сначала выбрать канонический домен;
- потом добрать missing content model;
- после этого перестроить workspace и preview;
- и только затем заниматься ускорением серийной работы и AI.

Самая правильная следующая единица работы после этого плана:

`короткий design/architecture decision на 1–2 страницы о том, кто канонически владеет equipment service landing и где живёт truth`.

Без этого любой дальнейший backlog будет двигаться, но не соберётся в устойчивую систему.
