# AUDIT.PAGE_WORKSPACE.FULL.V1

## 1. Executive Summary

Вердикт: **PASS WITH MAJOR ISSUES**

Historical alignment note: этот аудит зафиксировал живое состояние на `2026-04-11`, до later-wave unified multi-type polishing. Упоминания видимой AI-панели, theme-badge feedback и тогдашних source-picker affordances нужно читать как описание именно той генерации workspace, а не как автоматическое описание более позднего live UI.

Page workspace в проверенной на тот момент версии уже не выглядит вторым параллельным editor flow: домен `Страницы`, registry-first вход, единый workspace, metadata modal и bounded AI действительно собраны в одну модель. На страницах, у которых уже есть draft/published revision, базовый ежедневный сценарий SEO-оператора работает: открыть страницу, поправить тексты, сохранить, посмотреть preview, открыть metadata и передать страницу в review.

Но до состояния "можно спокойно пользоваться каждый день без боли" экран ещё не дотягивает. Главный blocker: из 12 страниц в реестре 6 страниц со статусом `Нет версии` открываются не в пустой рабочий экран, а в `500 This page couldn’t load`. Это ломает целостность registry → workspace flow и делает половину текущего списка по сути мёртвыми карточками.

Дополнительно есть заметные P1/P2 проблемы:

- default CTA copy в preview и review отображается в mojibake;
- пустые source pickers для `Услуги` и `Кейсы` почти ничего не объясняют оператору;
- AI-панель bounded по ownership, но UX target/action неочевиден: действие "Предложить связку" может вернуть patch не для связки, а для hero, если пользователь не заметил активную зону;
- viewport switcher полезен, но tablet mode практически не отличается от desktop;
- у страниц нет явного delete/archive management path в registry/workspace.

Итог: архитектурно направление верное, но по эксплуатационному качеству это пока не fully-ready operator tool, а рабочий first slice с одним P0 blocker и несколькими заметными UX / completeness gaps.

## 2. Scope

Аудитирован пользовательский сценарий вокруг:

- registry: `/admin/entities/page`
- page workspace: `/admin/entities/page/[pageId]`
- связанный handoff в review: `/admin/review/[revisionId]`
- fallback create route: `/admin/entities/page/new`

Проверка включала три уровня:

1. Functional correctness
2. Workflow completeness
3. UX usability для SEO-специалиста

Источники истины:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/PAGES_SINGLE_WORKFLOW_Экостройконтинент_v1.md`
- `docs/implementation/PLAN.PAGES_SINGLE_WORKFLOW_REFACTOR.v1.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_SINGLE_WORKFLOW_EPIC.V1.report.md`
- `docs/reports/2026-04-10/IMPLEMENTATION.EXECUTION.PAGES_FOLLOWUP_CLEANUP_AND_POLISH.V1.report.md`

Дополнительно просмотрены code zones:

- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `app/api/admin/entities/page/[pageId]/workspace/route.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageMetadataModal.js`
- `components/admin/PreviewViewport.js`
- `lib/admin/page-workspace.js`
- `lib/admin/list-visibility.js`
- `lib/content-core/pure.js`
- `lib/content-core/schemas.js`
- `tests/page-workspace.route.test.js`

## 3. Scenarios

### Scenario 1 — Реестр страниц

### Fact

Registry открывается стабильно и уже читается как единый первый вход в page workflow.

Что проверено:

- карточки открываются по умолчанию;
- `Карточки / Список` переключаются;
- поиск работает;
- фильтр по `Тип страницы` работает;
- card menu `⋯` даёт `Открыть страницу`, `Метаданные`, `История`;
- из меню `История` маршрут открывается.

Live observations:

- всего страниц в реестре на момент проверки: `12`;
- поиск по `тест` сузил выдачу до `2` карточек;
- фильтр `Контакты` сузил выдачу до `2` карточек;
- list mode показал `12` ссылок `Открыть страницу`.

### UX verdict

Быстро найти страницу можно, если известно название или тип. Для небольшого корпуса информации достаточно. Карточка остаётся лёгкой и не превращается в dashboard.

### Limitations

Управление ограничено:

- есть `Метаданные` и `История`;
- нет удаления;
- нет архивации;
- нет quick review/publish actions на уровне карточки.

Для текущего slice это не ломает вход в работу, но как операторский registry management surface он ещё неполный.

---

### Scenario 2 — Открытие страницы

Проверено открытие всех 12 доступных страниц из текущего registry inventory.

### Fact

Из `12` страниц:

- `6` страниц открылись корректно в page workspace;
- `6` страниц открылись в `500 This page couldn’t load`;
- `401` не обнаружено ни на одной странице;
- redirect to login не наблюдался.

### Fact

Все сломанные страницы имеют общий паттерн:

- в registry они отображаются как `Без названия`;
- сигнал: `Нет версии`;
- у них нет current/published revision.

### Evidence

Live URLs, которые падают:

- `/admin/entities/page/entity_1f336176-c972-442b-9813-0ae559e63e40`
- `/admin/entities/page/entity_dc2bb4ef-4e52-4c2c-9bc3-2dbda9e73dcd`
- `/admin/entities/page/entity_b7499a66-8e42-42b9-bcfe-a6b9df2fb9d9`
- `/admin/entities/page/entity_e883c85a-c83d-4f55-a756-3d6b02f2d57f`
- `/admin/entities/page/entity_a4e36af2-ceb0-4a70-a16b-86423681aefb`
- `/admin/entities/page/entity_bff259aa-d132-4dec-a41e-db02fef3b7a7`

### Fact

Локальная code verification подтверждает data-rooted cause:

- `buildPageWorkspaceBaseValue(null)` даёт пустые `title` и `h1`;
- `buildPageWorkspacePreviewPayload(...)` дальше вызывает `normalizeEntityInput(ENTITY_TYPES.PAGE, ...)`;
- `pageSchema` требует non-empty `title` и `h1`.

Это воспроизводится локально как `ZodError` по полям `title` и `h1`.

Ключевые зоны:

- `lib/admin/page-workspace.js`
- `lib/content-core/pure.js`
- `lib/content-core/schemas.js`

### Inference

Причина не в auth и не в route wiring. Это data + preview normalization seam: workspace не умеет безопасно открывать page entity без revision и падает раньше, чем успевает показать пустой state.

### Severity

**P0 blocker**

Почему blocker:

- registry обещает, что карточка откроет рабочий экран;
- для половины текущих карточек это неверно;
- operator не понимает, какие страницы реально рабочие, а какие мёртвые;
- это разрушает базовый trust в registry-first flow.

---

### Scenario 3 — Основной экран страницы

Проверялось на working draft pages (`about` and `contacts` types).

### Fact

Структура экрана читается:

- слева `Источники`;
- в центре `Сборка страницы`;
- справа `AI-панель`;
- внизу preview.

### Fact

Базовое редактирование работает:

- поля `Название страницы`, `H1`, `Интро`, `Основная связка`, `CTA` редактируются;
- `Сохранить страницу` даёт явный feedback `Черновик страницы сохранён.`;
- после reload изменения остаются.

### UX verdict

На working page специалист может реально работать. Центр ощущается как один документ: сначала hero, затем selected sources, затем связочный текст, затем CTA/contact block. Это намного лучше старого split-screen narrative.

### UX issues

- В шапке много концептуального текста про ownership, metadata и truth. Это честно архитектурно, но для ежедневной работы перегружает верхний слой.
- Страница всё ещё немного "объясняет себя" вместо того, чтобы просто дать работать.
- Часть интерфейса остаётся ближе к инженерному прототипу, чем к отполированному инструменту SEO-оператора.

---

### Scenario 4 — Связочный текст (composition)

### Fact

Связочный текст редактируется inline в центре мольберта как `Основная связка`. Это соответствует page-owned composition rule.

### UX verdict

Страница ощущается скорее как связный документ, чем как случайный набор disconnected блоков. Hero → sources → connective copy → CTA/contact выстроены логично.

### Limitation

Модель пока узкая:

- есть одно основное поле связки;
- нет более тонкой работы с несколькими переходами между несколькими секциями;
- нет richer inline structure beyond current textarea model.

Это acceptable first-slice limitation, не баг.

---

### Scenario 5 — Левая панель (источники)

### Fact

Launcher rail itself реализован правильно:

- `Медиа`
- `Кейсы`
- `Услуги`

Это визуально легче старого warehouse approach.

### Fact

`Медиа` modal работает лучше всего:

- открылся;
- показал `5` hero asset options;
- позволяет выбрать главный кадр.

### Fact

`Кейсы` и `Услуги` modals в текущем контуре были пустыми (`0` options each).

### UX issue

Пустые picker-модалки почти ничего не объясняют оператору. В них остаются только:

- заголовок;
- общая системная фраза;
- `Отмена / Применить`.

Нет явного empty state вроде:

- почему список пуст;
- есть ли вообще опубликованные сущности;
- что делать дальше.

### UX verdict

Идея панели правильная, но практическая полезность пока uneven:

- для media — уже usable;
- для services/cases — UX деградирует, если контент ещё не подготовлен.

---

### Scenario 6 — Метаданные

### Fact

Metadata modal открывается и с registry, и из workspace. Внутри есть вкладки:

- `Основное`
- `Маршрут`
- `SEO`

Проверены поля:

- theme;
- open graph image asset id;
- meta title / description;
- slug;
- page type;
- canonical intent;
- indexation;
- open graph title / description.

### UX verdict

Для first slice metadata layer выглядит достаточно полноценным. Он не перегружен и реально убирает редкие поля с основного полотна.

### Notes

- модалка по смыслу удачная;
- composition и metadata разделены правильно;
- для daily SEO-работы полей хватает, но advanced SEO-оператору позже может захотеться больше preview-adjacent signals прямо здесь.

---

### Scenario 7 — Визуальная настройка (цвет / тема)

### Fact

Theme control в проверенной тогда версии реализован и находится в metadata modal (`Основное`).

Проверено:

- theme selector переключается;
- save metadata проходит;
- header badge with theme label меняется в той audit generation workspace;
- preview DOM class у `StandalonePage` меняется после save.

### UX verdict

Это не missing feature. Фича реализована.

### UX note

Но discoverability низкая: оператор увидит её только если зайдёт в metadata modal. Для текущего канона это допустимо, но как visual tuning affordance она довольно спрятана.

---

### Scenario 8 — AI панель

### Fact

AI не выглядит вторым редактором и не пишет truth молча.

Что подтверждено:

- есть выбранная зона;
- есть отдельный intent textarea;
- есть ограниченный список действий;
- AI возвращает suggestion patch;
- patch применяется отдельно кнопкой `Применить патч`;
- после apply оператор всё равно должен явно сохранить страницу.

### Good

Ownership boundary соблюдена хорошо. Это один из сильных моментов текущей реализации.

### UX issue

Действие и зона сцеплены недостаточно очевидно. В live-проверке действие `Предложить связку` вернуло patch по hero (`title/h1/intro`), потому что активной зоной остался `Hero`. Для оператора это выглядит как semantic mismatch:

- по тексту кнопки ожидается связочный текст;
- по факту результат зависит от выбранной зоны.

### UX issue

Feedback у AI есть, но слабый:

- нет особенно ясного loading-state;
- первое впечатление — будто кнопка может "подумать и молчать";
- результат становится понятен только после ожидания и чтения текстового статуса.

### Verdict on AI

AI useful but not yet calm and obvious. Ownership-safe, но UX ещё шероховатый.

---

### Scenario 9 — Preview

### Fact

Preview в workspace реален и использует canonical `StandalonePage` renderer. Это подтверждается и по коду, и по поведению.

### Fact

Viewport switcher работает неравномерно:

- desktop width: ~651 px
- mobile width: `390 px`
- tablet width: ~651 px

### UX issue

`Планшет` почти не отличается от `Компьютер`, поэтому device switcher частично теряет смысл.

### Fact

Preview отражает content edits и metadata theme changes.

### Serious content issue

В preview видны garbled default CTA strings (`РЎРІ...`). Это operator-facing and preview-facing defect.

---

### Scenario 10 — Сохранение

### Fact

Manual save работает:

- правки сохраняются;
- после reload остаются;
- статус `Черновик страницы сохранён.` показывается;
- dirty state уходит.

### Fact

UI не показал признаков hidden overwrite между metadata и composition. Code-level tests это дополнительно подтверждают:

- `tests/page-workspace.route.test.js` проверяет `save_composition keeps metadata canonical`
- `tests/page-workspace.route.test.js` проверяет `save_metadata keeps page composition intact`
- `tests/page-workspace.route.test.js` проверяет `suggest_patch returns bounded AI patch without saving canonical truth`

### Verdict

Save semantics выглядят healthy. Критических конфликтов `metadata vs content` или `AI vs manual` в проверенном сценарии не обнаружено.

---

### Scenario 11 — Жизненный цикл страницы

### Fact

Из workspace доступны:

- `История`
- `Открыть проверку`
- `Передать на проверку`

### Fact

`Передать на проверку` реально уводит в review flow. Review page дальше даёт explicit owner decision actions:

- `Одобрить`
- `Отклонить`
- `Вернуть с комментарием`

Это соответствует канону explicit downstream operations.

### Fact

Delete/archive for pages в registry/workspace не обнаружены.

### Assessment

- review handoff реализован;
- publish остаётся downstream, что правильно;
- archive/delete в page operator flow отсутствуют.

### Verdict

Это не ломает канон, но как жизненный цикл страницы surface пока неполный. Для операторской работы нужна ясность: page cannot be removed/archived here, или для этого нужен отдельный путь.

## 4. Findings

### Что работает хорошо

1. Реестр действительно стал единым first-entry screen и быстро ищется по названию.
2. На валидных страницах workspace читается как один экран, а не как split между editor и AI.
3. Composition чувствуется page-owned, особенно вокруг связочного текста.
4. Metadata layer удачно убирает редкие поля с основного полотна.
5. Save semantics и AI ownership boundary выглядят аккуратно и безопасно.
6. Review handoff существует и соответствует explicit downstream posture.

### Ответы на обязательные вопросы

1. **Можно ли специалисту работать без боли?**
   Частично. На страницах с revision — да, но без спокойствия нельзя из-за `500` на страницах `Нет версии`, mojibake в preview и сыроватых пустых picker states.

2. **Есть ли полный сценарий редактирования страницы?**
   Для working draft page — да: открыть, править, сохранить, проверить preview, поправить metadata, отправить в review. Для pages without revision — нет, сценарий ломается на открытии.

3. **Есть ли функциональные дыры?**
   Да. Главная — невозможность открыть pages without revision. Вторичная — отсутствие page delete/archive management path.

4. **Есть ли UX-ломающие моменты?**
   Да. P0 — dead cards в registry. P1/P2 — mojibake, пустые pickers без empty state, слабая ясность AI targeting, невнятный tablet preview.

5. **Где интерфейс мешает работе?**
   В dead-card сценарии, в пустых source modals, в AI action wording vs selected target, и в garbled default copy, которую оператор вынужден mentally декодировать.

6. **Какие 5 улучшений дадут максимум эффекта?**
   См. раздел `Top Improvements`.

## 5. Bugs

### P0 blockers

1. **Страницы со статусом `Нет версии` открываются в `500 This page couldn’t load` вместо пустого workspace state.**
   Тип: functional blocker
   Ось: `registry -> workspace`
   Причина по evidence: empty page проходит в preview normalization, где `title/h1` обязательны.

### P1 проблемы

1. **Default CTA strings отображаются в mojibake в workspace/review preview.**
   Тип: content/encoding bug
   Evidence:
   - live preview показывает `РЎРІ...`
   - code literals already corrupted in `lib/content-core/pure.js`

2. **Page lifecycle management for delete/archive отсутствует в самом page flow.**
   Тип: missing functional management affordance
   Это не ломает редактирование, но создаёт operational gap.

3. **AI action wording может вести к patch не той зоны, которую ожидает пользователь.**
   Тип: UX/interaction bug
   Evidence: `Предложить связку` при активной зоне `Hero` вернул patch по `title/h1/intro`.

### P2 UX проблемы

1. **Пустые picker-модалки `Услуги` / `Кейсы` не объясняют, что происходит и что делать дальше.**
2. **Tablet preview почти не отличается от desktop preview.**
3. **Шапка workspace перегружена объяснительным системным текстом.**
4. **AI panel даёт слабый progress feedback, пока ждёшь результат.**

## 6. UX Analysis

### Общая пригодность для SEO-специалиста

Экран уже ближе к реальному рабочему инструменту, чем к инженерному ЦУП. Это чувствуется по трём вещам:

- основная работа остаётся в центре;
- metadata не мешают;
- AI не отнимает ownership.

Это сильная сторона текущего single-workflow model.

### Где UX уже хороший

- page composition ощущается как документ, а не как разрозненная форма;
- metadata реально убраны с первого слоя;
- launcher rail заметно легче старого warehouse UX;
- сохранение и review handoff понятны.

### Где UX ещё мешает

- registry обещает открыть страницу, но часть карточек убивает в 500;
- preview показывает garbled copy и тем самым подрывает доверие к качеству page output;
- AI требует больше mental bookkeeping, чем хочется оператору;
- empty source states выглядят как недоделанный интерфейс, а не как осознанная пустота.

### Ежедневный UX verdict

Работать можно, но пока не спокойно. Экран пригоден для daily use только на "здоровых" страницах и только если оператор готов терпеть несколько шероховатых зон.

## 7. Missing Features

1. Явный empty state inside `Услуги` / `Кейсы` pickers.
2. Ясный page delete/archive path или хотя бы объяснение, где он живёт.
3. Более понятная связка между AI action label и selected target.
4. Более заметный progress/result UX для AI действий.
5. Более практичный tablet preview, отличимый от desktop.

## 8. Verdict

**PASS WITH MAJOR ISSUES**

Почему не `PASS`:

- есть P0 blocker на открытии pages without revision;
- есть P1 content-quality defect (mojibake default CTA);
- есть несколько операторских UX gaps, которые заметно мешают everyday confidence.

Почему не `FAIL`:

- на страницах с revision workspace действительно работает как единый инструмент;
- save / metadata / preview / review handoff / bounded AI в целом функционируют;
- single-workflow model не сломана и читается правильно.

## 9. Top Improvements

1. **Починить opening path для pages without revision.**
   Вместо `500` нужен честный empty workspace state с минимальным first-draft scaffold.

2. **Исправить mojibake default CTA strings.**
   Это напрямую влияет на доверие к preview и quality of output.

3. **Добавить пустые состояния в source pickers.**
   Оператор должен понимать, почему список пуст и что делать дальше.

4. **Упростить AI targeting UX.**
   Кнопка `Предложить связку` должна яснее показывать, к какой зоне применится действие, либо сама подсказывать конфликт action vs target.

5. **Довести operator lifecycle around page management.**
   Либо дать delete/archive path, либо явно показать, что управление жизненным циклом происходит только через downstream review/history flow.
