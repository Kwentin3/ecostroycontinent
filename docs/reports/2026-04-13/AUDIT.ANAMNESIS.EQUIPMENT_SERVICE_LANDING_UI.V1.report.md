# AUDIT.ANAMNESIS.EQUIPMENT_SERVICE_LANDING_UI.V1.report

## 1. Executive Summary

Verdict: **FAIL**

Текущий `page workspace` уже выглядит как цельный редактор статических страниц: реестр, create modal, единый workspace, metadata modal, bounded AI, preview и review handoff действительно существуют и в live UI работают без падений. Но это не делает его инструментом для сценария `SEO-специалист собирает лендинг услуги по предоставлению/аренде техники из карточек техники`.

Ключевая проблема не в одном баге, а в доменном mismatch:

- домен `Page` в текущей реализации ограничен типами `about` и `contacts`, а не `service landing` или `equipment landing`;
- в content core вообще нет сущности `equipment` / `technique card`;
- source picker в page workspace умеет работать только с `services`, `cases`, `media`;
- service landing tooling живёт отдельно внутри `service` entity flow и не делает page workspace инструментом сборки коммерческой посадки под технику;
- preview использует `StandalonePage` без реальной шапки/подвала и не показывает страницу в её полном публичном shell;
- текущий live contour пуст по страницам и услугам, поэтому сценарий сборки "от карточек" сейчас не просто неудобен, а фактически не запускается end-to-end.

Итог: как narrow static-page editor текущий UI жизнеспособен. Как SEO/operator tool для equipment-service landing scenario он **не готов** и в текущем состоянии не решает пользовательскую задачу без лезвия в код и без доменной перестройки.

## 2. Source Docs Used

Точные пути из запроса были найдены и использованы без замены:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report.md`

Дополнительно использованы реальные code zones и live runtime evidence:

- `components/admin/PageRegistryClient.js`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageMetadataModal.js`
- `components/admin/PreviewViewport.js`
- `components/public/PublicRenderers.js`
- `lib/admin/page-workspace.js`
- `lib/content-core/content-types.js`
- `lib/content-core/schemas.js`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/ServiceLandingWorkspacePanel.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `app/api/admin/entities/service/landing-factory/generate/route.js`

## 3. Target User Story

Как SEO-специалист, я хочу взять карточку техники или набор карточек техники и собрать из них полноценный лендинг услуги, чтобы получить:

- понятный коммерческий оффер;
- SEO-нормальную структуру;
- внятный визуальный и смысловой ритм;
- proof-блоки;
- рабочие CTA;
- готовность к preview, review и публикации без кода.

## 4. Scenarios Verified

### Verification method

Проверка велась на двух уровнях:

- code audit по фактическим UI/API зонам;
- live UI smoke на `https://ecostroycontinent.ru` под реальным `superadmin` session.

### Live contour observations on 2026-04-13

- `/admin/entities/page` открылся стабильно.
- Реестр страниц показал `Всего записей: 0`.
- Create modal страницы доступен и работает.
- В create-flow доступны только типы `О нас` и `Контакты`.
- Для проверки workspace была создана test-marked страница `test__page__equipment-service-audit__20260413`, затем удалена через штатный delete flow.
- Внутри page workspace source launchers были только `Медиа`, `Кейсы`, `Услуги`.
- Source picker `Услуги` показал empty state: в реестре услуг нет записей.
- `/admin/entities/service` в live contour тоже показал `Всего записей: 0`.
- AI flow сработал технически, но на запрос про переход от блока техники к CTA вернул пустой patch.
- `Открыть проверку` открыл review route.
- Draft-only delete flow отработал корректно и вернул в реестр с сообщением `Сущность удалена`.

### Scenario 1 — Реестр страниц как стартовая точка

Result: **частично работает, но не для целевого сценария**

- Реестр как экран существует и не падает.
- Есть поиск, фильтры, `Карточки / Список`, `Новая страница`.
- В live contour реестр пустой: `0` страниц.
- Как стартовая точка для программы landing pages под технику экран сейчас не помогает, потому что там нет ни текущего корпуса страниц, ни доменного входа в service/equipment landing.

### Scenario 2 — Создание landing page под технику

Result: **не поддержано доменно**

- Create modal быстрый и понятный.
- Но тип страницы ограничен двумя значениями: `О нас`, `Контакты`.
- Значит create flow не умеет создать `landing page услуги`, `equipment service landing`, `geo landing` или любой другой money-page type.

### Scenario 3 — Использование карточек техники как основы страницы

Result: **не поддержано**

- В content core нет сущности `equipment` / `technique`.
- В page workspace нет equipment picker.
- Есть только `services`, `cases`, `media`.
- Даже если трактовать `service` как прокси для техники, это всё равно другой домен: сервисная карточка, а не карточка единицы техники.
- В live contour и этот прокси-сценарий не запускается, потому что `services` registry пуст.

### Scenario 4 — Коммерческий оффер и hero

Result: **частично поддержано на базовом уровне**

- Можно задать title, H1, intro.
- Можно задать финальный CTA.
- Нельзя задать отдельный service offer model под аренду/предоставление техники, срочную подачу, технику с оператором, тарифный/коммерческий акцент, SLA-like promise, локальную availability logic.
- Доверительный слой для first screen сведён к общему тексту и теме страницы.

### Scenario 5 — SEO-структура страницы

Result: **недостаточно для commercial SEO landing**

- H1 есть.
- Metadata modal содержит slug, intent, meta title/description, OG.
- Но сама композиция крайне узкая: hero, один connective block, финальный CTA/contact, плюс автоотрисовка service/case/gallery blocks.
- Нет удобного page-level section model для `что за услуга`, `какая техника`, `преимущества`, `где работаем`, `кейсы`, `FAQ`, `как заказать` как управляемых самостоятельных смысловых слоёв.

### Scenario 6 — Гео и локальный интент

Result: **почти не поддержано**

- В metadata есть `canonical intent`, но нет page-owned geo model.
- Нет отдельных полей или блоков под город, район, service area, зону выезда, локальные модификаторы.
- Нельзя собрать локальную SEO-посадку уровня `аренда экскаватора в Сочи` как first-class сценарий.

### Scenario 7 — Характеристики техники и proof-content

Result: **не поддержано**

- Нет equipment specs layer.
- Нет distinction между "взято из карточки техники" и "написано вручную".
- Нет связки `техника -> сценарии применения -> proof -> кейс`.
- Нет отдельных proof-блоков, кроме возможности подтянуть services/cases/galleries как общие refs.

### Scenario 8 — Работа с медиаматериалами

Result: **базово поддержано, но не на уровне landing scenario**

- Можно выбрать главный кадр и галереи через media picker.
- Можно управлять главным изображением и галереей.
- Нет явного разделения `hero media` vs `body gallery strategy` кроме одного primary asset и связанных gallery refs.
- Нет UX для слабого photo corpus именно под технику.

### Scenario 9 — Цвет, тема, акценты

Result: **реализовано, но скрыто и узко**

- Theme selector существует в metadata modal.
- Preview отражает theme.
- Это скорее `discoverability problem`, чем missing feature.
- Но visual control базовый и не даёт SEO-специалисту тонко управлять коммерческими акцентами лендинга.

### Scenario 10 — Связанные блоки и логика повествования

Result: **частично поддержано**

- Есть один связочный текстовый блок.
- Есть порядок linked source refs.
- Нет полноценной работы с драматургией страницы как с цепочкой секций.
- Нет явного reorder/edit model для самостоятельных narrative blocks beyond current narrow composition.

### Scenario 11 — Шапка и подвал

Result: **не видно реальную страницу**

- Preview использует `StandalonePage`.
- В нём нет публичной шапки и подвала.
- Значит нельзя оценить конфликт hero с header, читаемость first screen под хедером, согласованность footer, реальный page shell.

### Scenario 12 — Метаданные

Result: **профессионально достаточны для статической страницы, недостаточны для equipment landing**

- Есть `slug`, `pageType`, `canonicalIntent`, `indexation`, OG/meta.
- Но metadata modal не компенсирует отсутствие доменной модели service landing.
- Для статической `about/contacts` страницы модалка адекватна.
- Для equipment-service landing она не решает ключевую задачу.

### Scenario 13 — AI-панель

Result: **bounded, но слабо полезна для target scenario**

- AI не сохраняет truth автоматически.
- Есть target/apply flow.
- На live-проверке запрос про переход от техники к CTA дал технически корректный, но фактически пустой patch.
- Для equipment scenario AI не заменяет отсутствующую доменную структуру и слабый source context.

### Scenario 14 — Preview

Result: **недостаточен для ежедневной SEO-работы над landing page под технику**

- Есть device switcher и canonical renderer preview.
- Видны copy/theme/basic blocks.
- Не видны header/footer.
- Не видна реальная service/equipment landing structure, потому что она не существует в page model.

### Scenario 15 — Публикация и жизненный цикл

Result: **частично поддержано**

- Есть `Сохранить страницу`, `Передать на проверку`, `Открыть проверку`.
- Review route открывается.
- Для draft-only pages есть `Удалить страницу`.
- Архив/снятие с live существует как capability слоя, но для этого сценария ценность ограничена тем, что сами equipment landing pages не моделируются first-class.

### Scenario 16 — Массовая/серийная работа

Result: **не поддержано на нужном уровне**

- Нет cloning/duplication flow под серию похожих посадок.
- Нет SEO guardrails против дублирования title/H1/intent на серийных страницах.
- Нет доменного шаблона под `техника x гео`.
- Даже одна such page не моделируется корректно, значит серийная работа пока не реальна.

### Existing handles / routes already present

Существующие page-workspace ручки и операционные действия:

- create page from registry modal;
- `POST /api/admin/entities/page/[pageId]/workspace` с действиями:
  - `save_composition`
  - `save_metadata`
  - `send_to_review`
  - `suggest_patch`
- downstream review route;
- downstream publish route;
- generic delete route for draft-safe entity removal;
- live-deactivation/archive capability for pages with live-published revision.

Но эти ручки решают static page workflow, а не equipment-service landing workflow.

## 5. Findings

### 5.1 What already works well

1. Единый page workflow действительно существует и не распадается на второй AI-экран.
2. Create flow быстрый и operator-friendly.
3. Metadata modal удачно вынесена из основного полотна.
4. AI bounded by design: patch-only, explicit apply, no silent save.
5. Preview технически жив и theme/device state отражает.
6. Review handoff и draft delete route доступны и работают.

### 5.2 P0 blockers

1. **Текущий `Page` domain не моделирует service/equipment landing.**
   Почему P0:
   - pageType ограничен `about/contacts`;
   - target user story требует service landing;
   - без first-class page type сценарий не стартует доменно.

2. **В системе нет first-class equipment/technique card entity.**
   Почему P0:
   - целевой сценарий построен вокруг карточек техники;
   - в content core есть только `media_asset`, `gallery`, `service`, `case`, `page`;
   - значит "собрать лендинг от техники" сейчас не на чем.

3. **Preview не показывает реальную страницу вместе с header/footer.**
   Почему P0 для этого сценария:
   - нельзя проверить first screen как коммерческий экран;
   - нельзя увидеть конфликт hero/header;
   - нельзя принять полноценное редакторское решение о publish readiness.

### 5.3 P1 functional gaps

1. Нет structured sections под commercial service landing:
   - offer;
   - equipment block;
   - advantages;
   - geo/service area;
   - FAQ;
   - how-to-order;
   - proof/cases bundle.

2. Нет source-link model "что синхронизировано из карточки, что overridden вручную".

3. Нет page-level geo layer для локального SEO intent.

4. Нет массового/серийного workflow под линейку однотипных посадок.

5. Service landing tooling существует отдельно в `service` flow, но не интегрировано в `pages` workflow.

### 5.4 P2 UX / usability gaps

1. Theme control существует, но слишком спрятан для частой визуальной настройки.
2. AI-панель честная, но для целевого сценария мало полезна без богатого source context.
3. Source pickers как launcher pattern удачны, но слишком абстрактны для domain-heavy landing assembly.
4. Preview удобен как basic copy/theme check, но не как commercial decision surface.
5. Реестр страниц в live contour пуст, поэтому entry screen не даёт оператору ощущения рабочего production corpus.

### 5.5 Missing features

1. `equipment / technique` entity and picker.
2. `service landing / equipment landing / geo landing` page type(s).
3. Structured commercial sections and reorderable story flow.
4. Sync vs manual override visibility for imported card content.
5. Geo/service-area editing model.
6. Proof blocks and equipment specs blocks.
7. Real shell preview with header/footer.
8. Clone/adapt flow for serial landing production.

### 5.6 Acceptable first-slice limitations

Это не баги сами по себе:

- bounded AI patch model;
- metadata as second layer;
- compact launcher rail instead of warehouse picker;
- simple theme selector instead of full design system builder.

Проблема в другом: даже хороший first slice здесь покрывает **не ту задачу**, которую нужно решить.

## 6. SEO / UX Analysis

### Functional correctness

Как static-page editor текущий UI функционально корректен.

Как equipment-service landing editor он функционально не закрывает основной сценарий, потому что:

- нет правильного типа страницы;
- нет правильного source domain;
- нет правильной preview shell;
- нет нужной структуры секций.

### Workflow completeness

Полный рабочий цикл `создать -> собрать -> посмотреть -> отправить в review -> удалить черновик` для статической страницы существует.

Полный рабочий цикл `взять технику -> собрать service landing -> проверить geo/offer/proof -> выпустить серию страниц` не существует.

### UX usability for SEO specialist

С позиции SEO-специалиста это не "сыроватый, но уже usable equipment landing tool". Это другой инструмент:

- он помогает редактировать статическую страницу;
- он не даёт мыслить страницей как коммерческой посадкой услуги по технике;
- он не даёт работать от техники как от source of truth;
- он не даёт видеть реальную публичную страницу в shell;
- он не даёт масштабировать сценарий на серию money pages.

### Direct answers to the mandatory questions

1. **Можно ли в текущем UI реально собрать лендинг услуги из карточек техники без лезвия в код?**
   Нет.

2. **Какие ручки уже достаточны?**
   Для статической страницы достаточны: create, save composition, save metadata, bounded AI patch, preview, review handoff, draft delete.

3. **Какие ручки критично отсутствуют?**
   Equipment entity/picker, service-landing page type, geo/proof/spec sections, shell preview, serial clone/adapt workflow.

4. **Что неудобно именно с позиции SEO-специалиста?**
   Нельзя мыслить страницей как локальной коммерческой посадкой услуги; нет гео, нет proof rhythm, нет техники как первичного источника, нет реального preview shell.

5. **Что мешает коммерческой и SEO-сборке страницы?**
   Доменно неверная модель страницы, отсутствие equipment source model, узкая композиция, отсутствие geo/proof/spec blocks.

6. **Что с цветом/темой/акцентами: реализовано, скрыто или отсутствует?**
   Базово реализовано, но скрыто в metadata modal и слишком узко для серьёзной visual tuning работы.

7. **Что с шапкой/подвалом: видит ли специалист реальную страницу?**
   Нет. Preview рендерит standalone body без реальной шапки и подвала.

8. **Достаточен ли preview?**
   Нет для target scenario. Да только для базовой copy/theme проверки статической страницы.

9. **Достаточны ли lifecycle actions?**
   Частично для static page flow. Недостаточно как lifecycle surface для production line equipment landings.

10. **Какие 5 доработок дадут максимальный эффект для сценария лендинга техники?**
   См. раздел `Top 5 Improvements`.

## 7. Missing Features

1. First-class `equipment/technique card` domain.
2. First-class page type для `service/equipment landing`.
3. Page builder model не свободный, но хотя бы structured commercial sections.
4. Geo/service area model.
5. Proof/content model: характеристики техники, кейсы, сценарии применения.
6. Visual mapping: что inherited from source, что overridden manually.
7. Real header/footer preview.
8. Clone/adapt/series workflow with SEO uniqueness guardrails.

## 8. Verdict

**FAIL**

Почему:

- target user story не поддержан на уровне доменной модели;
- page workspace предназначен для статических `about/contacts` pages, а не для service/equipment landings;
- карточек техники как сущности нет;
- preview не показывает реальную страницу;
- серийная SEO-сборка посадок не моделируется;
- даже live contour сейчас пуст по страницам и услугам, то есть оператор не может выполнить сценарий practically, даже если принять доменные компромиссы.

## 9. Top 5 Improvements

1. **Ввести first-class `equipment/technique` entity и связанный source picker.**
   Это базовый доменный фундамент. Без него сценарий "строим от карточки техники" фиктивен.

2. **Расширить `Page` domain или связать его с `Service` domain через новый page type `service/equipment landing`.**
   Либо pages начинают владеть commercial service landings, либо current separate service-landing flow становится каноническим входом и встраивается в page workflow, а не живёт рядом.

3. **Добавить structured commercial sections вместо узкой static-page композиции.**
   Минимум:
   - offer/hero;
   - equipment block;
   - преимущества;
   - geo/service area;
   - кейсы/proof;
   - FAQ;
   - how-to-order / CTA.

4. **Сделать source-sync layer: inherited vs overridden.**
   SEO-оператор должен видеть:
   - что подтянуто из карточки техники;
   - что он переписал руками;
   - где есть риск расхождения.

5. **Довести preview до реального public shell и добавить serial workflow.**
   Нужно:
   - header/footer в preview;
   - page shell fidelity;
   - clone/adapt flow для серий `техника x гео`;
   - guardrails против дублей `title/H1/intent`.

## 10. Final SEO-Operator Verdict

Текущий UI можно использовать как аккуратный редактор статических страниц и как bounded editorial surface. Но называть его рабочим инструментом для сборки коммерческого equipment-service landing сейчас нельзя.

Если смотреть глазами SEO-специалиста, проблема не в том, что "хочется побольше красоты". Проблема в том, что продукт пока не даёт собрать сам объект работы:

- нет карточки техники как источника;
- нет подходящего типа страницы;
- нет нужной структуры;
- нет реального preview;
- нет масштабируемого операторского потока.

Поэтому текущий ответ на вопрос "тянет ли page workspace лендинг услуги по технике?" — **нет**.
