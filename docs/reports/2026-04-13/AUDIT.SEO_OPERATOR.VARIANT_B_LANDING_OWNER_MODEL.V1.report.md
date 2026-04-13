# AUDIT.SEO_OPERATOR.VARIANT_B_LANDING_OWNER_MODEL.V1.report

## 1. Executive Summary

Verdict: **RECOMMENDED WITH CONDITIONS**

Вариант B в целом выглядит правильнее для сценария `equipment-service landing`, чем попытка дальше растягивать текущий `Page workspace`. Для SEO-специалиста эта модель потенциально удобнее, потому что она лучше совпадает с реальным объектом работы:

- техника становится источником фактуры;
- service landing становится местом, где собирается коммерческий оффер;
- public/page shell перестаёт быть вторым владельцем истины и остаётся projection/read-side слоем.

Это лучше текущей static Page-oriented модели по трём главным причинам:

1. truth становится доменно честнее;
2. легче масштабировать серию похожих money pages;
3. ниже риск, что SEO-оператор будет собирать коммерческую посадку в редакторе, который по смыслу предназначен для `about/contacts`.

Но вариант B нельзя принимать как “автоматически удобный”, только потому что он архитектурно чище. В текущем виде ближайший прототип service-flow уже показывает и сильную сторону, и риск:

- сильная сторона: service-domain ближе к `/services/[slug]` и уже умеет работать как route-owning сущность;
- риск: editor легко становится слишком тяжёлым, diagnostic-heavy и cognitively expensive для ежедневной работы.

Поэтому финальная оценка такая:

- как стратегический вектор Variant B правильный;
- как операторское рабочее место он сработает только при жёстком соблюдении нескольких условий;
- если эти условия не выполнить, команда просто заменит одну неудобную модель на другую, более сложную.

## 2. Variant B recap in plain language

Вариант B простыми словами:

- у нас есть карточка техники как первичный источник;
- из неё и связанных материалов собирается landing услуги;
- редактирование landing-а живёт в каноническом service-domain workflow;
- публичная страница и page shell не редактируются отдельно как второй владелец той же посадки;
- public layer только показывает собранный результат, маршруты, shell, preview/read-side представление и publish projection.

Для SEO-специалиста это означает:

- работать не “со страницей вообще”, а с коммерческой услугой;
- не дублировать технику вручную в `Page`;
- не гадать, где правда: в карточке страницы или в карточке услуги;
- не жить между двумя почти одинаковыми редакторами.

## 3. Why current model is insufficient for the target scenario

Current Page-oriented model недостаточна не потому, что она “плохая”, а потому, что она решает другой класс задач.

Что уже хорошо в текущем `Page workspace`:

- registry-first вход;
- единый workspace;
- metadata modal;
- bounded AI;
- preview;
- review handoff.

Но для `equipment-service landing` она не годится как канонический owner, потому что:

- `Page` доменно ограничен standalone pages;
- page type не описывает service/equipment landing;
- нет first-class `equipment`;
- page composition слишком узка для geo/proof/spec/commercial sections;
- public preview не даёт полной уверенности для money-page сценария;
- serial production под `техника x гео` там выглядит как натягивание не той модели.

Иными словами:

- current `Page` хорош для `about/contacts`;
- target scenario принадлежит route-owning коммерческому домену, а не standalone page domain.

## 4. SEO-operator simulation by scenarios

### Verification basis

Использованы:

- все обязательные source docs из запроса;
- предыдущий аудит equipment landing scenario;
- remediation plan по Variant B;
- code zones вокруг `service` editor, `landing-factory`, entity schemas и route ownership;
- live contour smoke на `https://ecostroycontinent.ru`.

Дополнительное live evidence:

- открыт `service` registry;
- открыт `service/new`;
- создан контролируемый test-marked service draft `test__service__variant-b-audit__20260413`;
- проверен saved state, readiness surface, delete path;
- test entity удалена через штатный flow.

### Scenario 1 — Создать новую landing page под одну единицу техники

#### Как это должно работать в Variant B

Оператор начинает не из `Page`, а из канонического landing/workspace flow:

1. открыть реестр landing-ов услуг;
2. выбрать `создать landing`;
3. выбрать технику как source basis;
4. задать оффер и вариацию услуги;
5. задать гео;
6. подтянуть proof;
7. собрать CTA;
8. увидеть public preview;
9. отправить в review.

#### Оценка

Это **проще по смыслу**, чем делать то же самое в `Page`, потому что:

- SEO-специалист думает услугой, а не static page;
- slug/intent/public route естественно живут в `service`;
- легче объяснить, откуда берутся proof, техника, медиа и geo.

#### Точки трения

Главная потенциальная боль не в домене, а в UX:

- если create flow будет слишком “формой сущности”, а не операторским стартом;
- если редактор будет перегружен diagnostics/panels;
- если техника как source будет не первым шагом, а buried subsection;
- если preview останется вторичным или неполным.

Вывод:

- концептуально проще, чем всё делать в `Page`;
- practically удобнее только при сильном create/start flow.

### Scenario 2 — Сделать серию похожих страниц

#### Оценка

Здесь Variant B заметно сильнее static-page модели.

Почему:

- service landing как канонический domain легче шаблонизировать;
- equipment source и geo modifiers можно масштабировать последовательно;
- проще держать один owner для route truth и SEO fields;
- проще строить clone/adapt flow без дублирования случайных page-level полей.

#### Что нужно против дублей

- clone/adapt flow с обязательным checklist уникализации;
- duplicate-risk warnings для `slug`, `H1`, `meta title`, `canonical intent`;
- явное отличие source-derived текста от вручную адаптированного;
- geo-specific validation.

Вывод:

- для серийного производства Variant B **лучше**, чем static-page модель;
- без guardrails он тоже может породить ручной duplicate mill.

### Scenario 3 — Обновилась карточка техники

#### Как Variant B должен вести себя

Нужно держать три состояния:

- `inherited`: блок или поле живёт от техники;
- `overridden`: оператор переписал вручную;
- `outdated`: источник изменился, а landing требует проверки.

#### Польза для SEO-оператора

Если это сделано ясно, Variant B очень силён:

- не надо вручную искать, где повторяли старую характеристику;
- можно быстро понять, какие посадки надо перепроверить;
- снижается риск расхождения техники и landing-а.

#### Риск

Если система будет слишком сложной и opaque, оператор начнёт теряться:

- что подтянулось само;
- что я менял руками;
- что теперь сломалось;
- что обязательно чинить, а что нет.

Вывод:

- это сильнейшее преимущество Variant B;
- но только при очень понятном `inherited / overridden / outdated` UX.

### Scenario 4 — Нужна быстрая коммерческая адаптация

#### Оценка

Variant B даёт правильную гибкость, если landing editor хранит:

- source truth отдельно;
- commercial adaptation отдельно;
- geo separately;
- proof selection separately.

Тогда можно быстро подать:

- ту же технику по другому офферу;
- с оператором;
- срочная подача;
- другой район;
- другой акцент.

#### Риск

Если всё это будет сложено в один тяжёлый editor без структурирования, получится не гибкость, а перегруженная машина.

Вывод:

- Variant B может дать гибкость **без потери порядка**;
- но только через сильную секционную структуру, не через flat mega-form.

### Scenario 5 — Preview и публикация

#### Оценка

У SEO-специалиста доверие к preview в Variant B может стать выше, чем в current Page model, потому что:

- preview строится из того же канонического landing truth;
- public shell уже не второй editor, а projection;
- review/publish handoff можно привязать к одной route-owning сущности.

#### Условие

Нельзя делать public projection вторым hidden owner. Preview должен читать канонический landing state, а не собственную page-тень.

Вывод:

- потенциально доверие выше;
- practically только если preview действительно показывает public shell и использует один truth path.

### Scenario 6 — Повседневная операторская жизнь

#### Оценка

Variant B может стать реальным рабочим местом SEO-специалиста, если он будет:

- начинаться из понятного landing registry;
- быстро открываться в structured workspace;
- позволять клонировать и адаптировать;
- ясно показывать source drift;
- не заставлять оператора читать trace-heavy diagnostics каждый день.

#### Main risk

Ближайший текущий service-editor уже показывает, где модель может стать слишком тяжёлой:

- readiness;
- session memory;
- evidence register;
- factory report;
- audit timeline.

Как инженерный surface это честно.
Как ежедневный SEO workplace это легко перегружает первый слой.

Вывод:

- Variant B способен стать рабочим местом;
- в сыром виде он слишком легко превращается в “доменную машину”, а не в спокойный operator tool.

## 5. Direct comparison: current model vs Variant B

| Критерий | Current static Page-oriented model | Variant B |
| --- | --- | --- |
| Удобство старта | Лёгкий start для standalone pages, но не для equipment landing | Лучше для target scenario, если старт идёт из landing/service registry |
| Понятность истины | Истина размазана: page пытается быть не своим доменом | Чище: equipment source + service landing truth + public projection |
| Сборка коммерческого оффера | Слишком узкая page composition | Естественнее, если оффер живёт в service landing sections |
| Локальный SEO-сценарий | Почти не поддержан | Подходит лучше, если geo становится first-class частью landing-а |
| Работа с доказательствами | Ограничена refs и узкой композицией | Сильнее, если proof связан с equipment/service truth |
| Работа с карточкой техники как источником | Не поддержана | Органично поддерживается моделью |
| Preview | Есть, но не для full landing truth | Может быть сильнее, если projection честно читает landing truth |
| Публикация | Есть downstream flow, но домен не тот | Более естественный publish path для `/services/[slug]` |
| Серийное производство страниц | Слабое | Сильнее при clone/adapt + duplicate guardrails |
| Контроль дублей | Слабый | Можно сделать сильнее на уровне canonical landing domain |
| Поддержка изменений в источнике | Почти отсутствует | Может быть сильной через inherited/override drift model |
| Операторская когнитивная нагрузка | Низкая на старте, но доменно неверная | Может быть выше; нужно специально облегчать UX |

### Bottom line of comparison

Current model выигрывает в одном: она легче как static editor.

Variant B выигрывает в главном: он лучше соответствует реальной ежедневной задаче SEO-оператора.

## 6. What Variant B improves

### 6.1 Source-of-truth clarity

Вариант B даёт более чистую истину по:

- технике;
- коммерческому офферу;
- гео;
- proof;
- SEO-полям;
- серийным посадкам.

Это его главное преимущество.

### 6.2 Lower dual-editor drift risk

Если `Page` перестаёт быть вторым landing editor, у команды меньше шанс получить:

- одну истину в service;
- вторую истину в page;
- третью в preview/public glue.

### 6.3 Better fit for route-owning money pages

PRD уже задаёт канон:

- `Service` owns canonical slug and core truth for `/services/[slug]`;
- `Page` owns standalone pages.

Variant B выравнивается под этот канон, current static Page expansion — нет.

### 6.4 Better basis for series production

Variant B естественно поддерживает:

- template-like reuse;
- clone/adapt;
- source drift awareness;
- duplicate guardrails;
- geo-driven scaling.

### 6.5 Higher operator confidence if preview is honest

Если preview строится как projection канонического landing-а, у SEO-оператора выше доверие к тому, что именно пойдёт в public.

## 7. What Variant B risks introducing

### 7.1 Heavy editor risk

Самый заметный риск:

- service-domain editor начнёт тащить слишком много readiness/factory/memory/trace информации;
- SEO-оператору придётся “обслуживать машину”, а не собирать страницу.

### 7.2 Hidden second editor risk

Если `Page` не будет жёстко выведен из landing ownership, команда всё равно получит второй редактор:

- service editor как canonical;
- page/public shell как “ну тут ещё можно подправить”.

Это главный архитектурный и продуктовый риск.

### 7.3 Overcomplicated inheritance risk

`Inherited / overridden / outdated` — очень полезная идея, но плохая реализация быстро сделает систему тяжёлой и непонятной.

### 7.4 Create-flow friction

Если стартовый flow будет длинным и сущностно-ориентированным, оператору станет тяжелее начинать, чем в current lightweight Page create flow.

### 7.5 Diagnostic-first posture

Если первый слой editor-а будет состоять из проверки, памяти, verification report и audit timeline, SEO-специалист будет чувствовать не рабочее место, а служебный cockpit.

## 8. Conditions for Variant B to succeed

### P0 conditions

1. Должен быть один канонический операторский вход.
   Не `Page`, не “иногда Service, иногда Page”, а один landing workspace.

2. `Page/public shell` должен остаться только projection/read-side.
   Без ручной редакции landing truth внутри public/page слоя.

3. `equipment` должен быть first-class source entity.
   Не псевдозамена через `service`.

4. Preview должен читать канонический landing truth и показывать public shell.

5. Должна быть ясная модель `inherited / overridden / outdated`.

### P1 conditions

1. Structured sections вместо flat mega-form.
2. Clone/adapt flow для серии страниц.
3. Duplicate guardrails для `slug/H1/meta/intent`.
4. Geo как first-class часть landing-а.
5. Proof/spec blocks как first-class часть landing-а.

### UX conditions

1. SEO-оператор видит страницу, а не инженерную диагностику.
2. Readiness и verification живут как support layer, не как основной экран.
3. Source selection начинается с техники и оффера, а не с низкоуровневых полей.

## 9. Conditions under which Variant B would fail

Variant B провалится, если случится хотя бы один из этих сценариев:

1. `Page` останется “на всякий случай” вторым editor-ом для landing-а.
2. `equipment` не станет first-class entity, а будет замаскирован под `service`.
3. editor превратится в тяжёлую форму с diagnostics-first posture.
4. public projection получит собственные редактируемые поля landing truth.
5. source inheritance будет слишком сложной и непрозрачной.
6. clone/adapt и duplicate guardrails не появятся, и серия страниц снова скатится в ручной ад.

## 10. Final Verdict

### Direct answers to the mandatory questions

1. **Если взять вариант B, станет ли SEO-специалисту реально удобнее собирать лендинги под технику?**
   Да, при условии что вход в работу будет канонически service/landing-first, а не diagnostics-first.

2. **Станет ли работа быстрее и масштабируемее, чем при попытке развивать current Page workspace?**
   Да. Особенно для серийной работы и для сценария “техника + гео + proof”.

3. **Даст ли модель B более чистую истину?**
   Да. По технике, офферу, geo, proof, SEO-полям и серии похожих страниц она чище current Page model.

4. **Не появится ли у команды всё равно второй конкурирующий редактор?**
   Появится, если не запретить landing truth внутри `Page/public shell`.

5. **Что должно быть каноническим операторским входом в работу?**
   Landing/service registry и landing workspace.

6. **Что должно остаться только public projection/read-side?**
   Public shell, route rendering, preview/read-side projection, sitemap/schema/read-side assembly.

7. **Где у SEO-специалиста будут реальные ежедневные плюсы?**
   В source clarity, geo/proof structure, serial production, update-from-source discipline и более честном publish flow.

8. **Где Variant B может оказаться неудобным?**
   В create flow, inheritance model и избыточно diagnostic-heavy editor-е.

9. **Какие условия обязательны, чтобы Variant B был реально удобным?**
   Один editor, first-class equipment, strong sections, honest preview, clear inheritance, clone/adapt, duplicate guardrails.

10. **Какой verdict: это правильный вектор или нет?**
   Да, это правильный вектор, но только при жёстких продуктовых ограничениях.

### Final verdict

**RECOMMENDED WITH CONDITIONS**

Почему не `STRONGLY RECOMMENDED`:

- у модели сильный product fit, но высокий риск перегрузить editor;
- очень легко случайно оставить `Page` вторым редактором;
- inheritance и diagnostics могут сделать ежедневную работу тяжелее, а не легче.

Почему не `TOO RISKY`:

- Variant B лучше совпадает и с target scenario, и с PRD route ownership canon;
- он реально сильнее current static-page expansion для money-page производства;
- основные риски известны, понятны и управляемы продуктовым дизайном.

## 11. Top 5 design requirements if we adopt Variant B

1. **One canonical editor only**
   `service landing editor` должен быть единственным местом редактирования landing truth. `Page/public shell` не должен оставаться скрытым запасным редактором.

2. **Equipment-first start flow**
   Создание landing-а должно начинаться с техники, оффера и geo basis, а не с абстрактной формы сущности.

3. **Structured sections, not mega-form**
   Hero/offer, equipment, geo, proof, FAQ, CTA, how-to-order должны быть отдельными понятными слоями.

4. **Clear inheritance UX**
   Оператор должен видеть:
   - что inherited;
   - что переписано;
   - что устарело после изменения source.

5. **True public preview and series workflow**
   Preview обязан показывать реальный public shell, а система должна поддерживать clone/adapt и duplicate guardrails для серии landing pages.

## 12. Source Docs Used

Точные пути из запроса были найдены и использованы.

Использованы:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/reports/2026-04-11/AUDIT.PAGE_WORKSPACE.FULL.V1.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_REMEDIATION_PLAN.V1.report.md`
- `docs/reports/2026-04-11/IMPLEMENTATION.EXECUTION.PAGE_WORKSPACE_POST_REMEDIATION_WAVE.V1.report.md`
- `docs/reports/2026-04-13/AUDIT.ANAMNESIS.EQUIPMENT_SERVICE_LANDING_UI.V1.report.md`
- `docs/reports/2026-04-13/PLAN.EQUIPMENT_SERVICE_LANDING_UI.REMEDIATION.V1.report.md`

Дополнительно просмотрены:

- `lib/content-core/content-types.js`
- `lib/content-core/schemas.js`
- `components/admin/EntityEditorForm.js`
- `components/admin/ServiceLandingWorkspacePanel.js`
- `components/admin/ServiceLandingFactoryPanel.js`
- `lib/landing-factory/service.js`
- `app/api/admin/entities/service/landing-factory/generate/route.js`

### Discrepancies noted

1. Путь PRD совпадает с запросом, но внутри сам документ уже маркирован как `v0.3.2`, а не `v0.3.1`.
2. `PAGES_SINGLE_WORKFLOW` остаётся корректным каноном для standalone pages, но не должен автоматически считаться каноном для equipment-service landing domain.

