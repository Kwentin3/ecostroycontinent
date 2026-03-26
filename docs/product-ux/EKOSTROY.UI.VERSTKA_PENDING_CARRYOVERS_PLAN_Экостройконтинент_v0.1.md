# EKOSTROY.UI.VERSTKA_PENDING_CARRYOVERS_PLAN_Экостройконтинент_v0.1

Статус: автономный план по оставшимся UI-изменениям  
Источник: [EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md](./EKOSTROY.UI.VERSTKA_NOTES_Экостройконтинент_v0.1.md) и [EKOSTROY.UI.VERSTKA_AUTONOMOUS_EXECUTION_PLAN_Экостройконтинент_v0.1.md](./EKOSTROY.UI.VERSTKA_AUTONOMOUS_EXECUTION_PLAN_Экостройконтинент_v0.1.md)  
Назначение: довести уже собранный admin UI до более понятной, дружелюбной и последовательной версии без переоткрытия канона

## 1. Executive decision

Рекомендуемая стратегия: не трогать уже внедрённый shared shell заново, а закрыть оставшиеся вопросы небольшими surface-family pack’ами.

Decision precedence: the notes keep historical questions and observations, but this plan is the canon for execution. If a note still looks like an open question and the plan has already canonized the posture, the plan wins.
The remaining questions in notes are context only. They do not reopen layout posture once this plan has canonized it.
If an implementation idea would introduce a second navigation grammar, move `Пользователи` into the support rail, or create a parallel upload path, it is out of scope unless a wave explicitly says otherwise.

Это важно, потому что базовая грамматика уже существует:
- RU-only shell уже живёт в админке;
- sticky sidebar, depth/breadcrumb bar и правый support rail уже работают;
- nested editor family уже объединена общим паттерном;
- `Пользователи` уже выделены как lighter CRUD candidate;
- role-facing landing states уже признаны нужными и частично отражены в notes.

Следовательно, дальше нужен не новый архитектурный эпик, а аккуратная доводка:
- `Проверка` как review surface;
- `Медиа` и `Галереи` как источник и сборка;
- `Кейсы` и `Услуги` как тяжёлые editor surfaces;
- `Пользователи` как отдельный CRUD surface;
- `Главная` и `Настройки` как shell/workflow surfaces, где важна плотность и иерархия.

Главный риск: пытаться исправить смысл только отступами и карточками.
Если поле выглядит внутренним, но на самом деле должно быть видимо пользователю, это не layout issue, а semantics issue.

## 2. Current baseline

Что уже не надо переизобретать:
- глобальный shell и его навигация;
- RU-only copy layer на code-defined surfaces;
- depth/breadcrumb navigation;
- right rail как support/status area;
- базовая role-aware IA;
- deploy/live verification loop.

Что сейчас осталось:
- `Проверка`: связь поле -> preview, переключение preview device mode, перенос readiness выше по экрану, более компактный diff.
- `Медиа`: объяснение экрана, разделение quick upload и edit flow, явное различие между `Файл`-контролами.
- `Галереи`: объяснение роли экрана, различие `Файлы галереи` и `Основной файл`, контроль над runtime thumbnail noise.
- `Кейсы` / `Услуги`: компактный audit rail, более устойчивый top grid, пояснения к taxonomy-like fields.
- `Пользователи`: полноценный lighter CRUD variant без имитации nested editor.
- `Главная` / `Настройки`: более собранная компоновка без лишнего вертикального воздуха.

Priority within the remaining work:
- `Проверка` and `Пользователи` are the highest-priority carry-over surfaces.
- `Проверка` is handled first as Wave 1, and `Пользователи` follows immediately as Wave 1b.
- `Главная` and `Настройки` are supporting shell/workflow cleanup, not the main product risk.
- `Медиа`, `Галереи`, `Страницы`, `Кейсы`, and `Услуги` follow as a family once the first two surfaces are locked down.

### Canonized postures

These are no longer open design questions:
- Global navigation stays in the left sidebar only.
- Nested depth is shown by the top depth/breadcrumb bar.
- The right rail stays support/status only.
- `Проверка` is the primary owner-facing decision packet surface and should be treated as a decision packet, not a generic long form.
- `Пользователи` stays in the main content area as a lighter CRUD surface. The only allowed choice is which main-content CRUD pattern works better, not whether it belongs in the support rail or nested-editor family.
- Any user-list placement outside the main content area is disallowed in this pass.
- For `Пользователи`, the only allowed patterns are main-content master-detail or main-content split-view. No support rail placement, no nested editor grammar, no tree navigation subtree.
- `Медиа` is the source library; `Галереи` are collections/albums built from media.
- Quick upload inside story editors is a candidate anti-pattern unless it clearly reuses the shared media engine and does not create a parallel upload path.
- `Смысл изменения`, `Тип проекта`, `Короткий адрес`, and `Канонический адрес` require boundary decisions before rename-only cleanup.
- The earlier note questions about tree navigation, sticky versus fixed sidebar, and user-list placement are historical only and do not reopen the canonized posture.

## 3. Execution doctrine

Canonical execution unit = surface family pack.

Пакеты выполнения:
- `shell/workflow pack`: `Главная`, `Проверка`, `Настройки`
- `media pack`: `Медиа`, `Галереи`
- `story editor pack`: `Страницы`, `Кейсы`, `Услуги`
- `crud pack`: `Пользователи`

Правила автономии:
- можно менять плотность, порядок, подписи-пояснения и раскрытие уже существующих блоков;
- можно добавлять короткие легенды экранов;
- можно убирать или скрывать дублирующийся visible control, если он оказался внутренним noise;
- можно переводить audit rail в более компактное раскрываемое представление, если подробности остаются доступны по клику;
- нельзя незаметно менять workflow meaning;
- нельзя подменять semantics/layout-issue;
- нельзя вводить вторую навигационную систему;
- нельзя превращать `Пользователи` в ещё один nested editor.

## 4. Recommended waves

### Wave 0. Baseline lock

Цель: зафиксировать, что уже реализовано, и не повторять shell work.

Scope:
- проверить актуальные live routes;
- сверить notes 15-31;
- собрать картину оставшихся изменений по source class: layout / semantics / workflow / runtime-data / fixture-noise.

Allowed changes:
- только уточнение плана и evidence;
- только narrow regression fixes, если обнаружится явный дефект.

Disallowed changes:
- новая навигация;
- новый shell;
- redesign;
- массовые label rewrites без решения по смыслу.

Proof package:
- route checklist;
- baseline screenshots;
- residual issue map.

### Wave 1. Shell / workflow pack

Targets:
- `Главная`
- `Проверка`
- `Настройки`
Primary target within this wave:
- `Проверка`
Supporting cleanup only:
- `Главная`
- `Настройки`

Goal:
- сделать стартовую поверхность компактнее;
- поднять status cues выше по иерархии;
- сделать review surface более readable;
- дать `Проверке` более явную связь field -> preview;
- сделать preview mode более полезным для desktop/tablet/mobile context;
- уменьшить ощущение тесноты в `Настройках`.

Allowed changes:
- reposition status blocks;
- compress or restack diff/comparison;
- add preview mode toggle if it reuses existing preview logic;
- add field-to-preview highlighting if it does not alter workflow meaning;
- tighten top spacing on dashboard/settings.

Disallowed changes:
- новый design language;
- отдельная mobile redesign ветка;
- изменение publish/review semantics.
- introducing a second navigation system for nested depth.

Review gate:
- только если preview linkage или status reordering начинает менять decision flow.

Proof package:
- before/after screenshots;
- first-viewport notes;
- route-by-route pass/fail.

### Wave 1b. CRUD pack

Target:
- `Пользователи`

Goal:
- сделать экран полноценным operational CRUD surface;
- обеспечить понятный list/form relationship;
- оставить shell grammar, но не превращать экран в nested content editor;
- ясно показать role, last activity, add, deactivate, and access management.

Preferred direction:
- lighter CRUD split-view or master-detail variant;
- list stays in main content area;
- right support rail remains support-only;
- no attempt to make users look like content entities.
- if the current layout cannot read cleanly as CRUD, adjust the main-content split rather than inventing a nested tree or support-rail list.

Disallowed changes:
- support rail as the main list;
- nested tree navigation as the primary CRUD pattern;
- child-view placement in the support rail;
- squeezing users into the nested editor grammar;
- moving the user list into the shell family.

Review gate:
- final layout choice only if it materially changes CRUD reading.

Proof package:
- list/detail screenshots;
- rationale for chosen split;
- first-viewport clarity notes.

### Wave 2. Media pack

Targets:
- `Медиа`
- `Галереи`

Goal:
- объяснить, что `Медиа` это библиотека исходников, а `Галереи` это подборки из уже загруженных файлов;
- убрать confusion вокруг двух `Файл`-подобных controls;
- сделать короткие screen legends в спокойном месте;
- проверить, действительно ли `Основной файл` и `Файлы галереи` нужны как два distinct controls.

Allowed changes:
- compact legend blocks;
- helper text for fields;
- separation of quick upload from editing;
- removal or hiding of a clearly internal-only control, if that is the correct boundary.

Disallowed changes:
- создание второй media flow;
- дублирование upload logic or reinforcing a quick-upload shortcut that does not reuse the shared media engine;
- перекраивание gallery into a different product.

Review gate:
- batch approval for `Основной файл`, `Смысл изменения`, `Канонический адрес`, если выяснится, что поле должно быть hidden / reference / taxonomy instead of plain text.

Proof package:
- media/gallery screenshots;
- legend text samples;
- semantics delta list;
- runtime noise notes for missing thumbnails.

### Wave 3. Story editor pack

Targets:
- `Кейсы`
- `Страницы`
- `Услуги`

Goal:
- сделать audit rail компактнее и легче;
- уменьшить ощущение перегруза в relation-heavy screens;
- сделать top form more resilient to long values;
- дать нормальный контекст taxonomy-like fields;
- не заставлять пользователя догадываться, что значит `Смысл изменения`, `Тип проекта`, `Короткий адрес`, `Канонический адрес`.

Allowed changes:
- expandable audit rail;
- denser top field grid;
- legend block for screen purpose;
- helper text for ambiguous fields;
- controlled select/reference if taxonomy semantics are already known.

Disallowed changes:
- изменение доменной модели;
- скрытая смена смысла поля;
- превращение relation blocks в другой workflow.

Review gate:
- one batch decision for ambiguous fields across both screens;
- especially if `Тип проекта` becomes select/reference or if `Смысл изменения` should be hidden.

Proof package:
- before/after screenshots;
- field semantics diff;
- notes on audit rail behavior;
- relation block readability notes.

### Wave 5. Consistency QA

Goal:
- убедиться, что изменения читаются как единая система, а не как разрозненные fixes.

Checks:
- loading / empty / error / no-access states on touched surfaces;
- keyboard/focus where interactive controls exist;
- no second navigation system;
- right rail stays support-only;
- no duplicate media flow appeared;
- runtime proof noise is separated from layout judgment;
- legends and helper text reduce guesswork instead of adding noise.

Proof package:
- screenshot matrix;
- route checklist;
- residual issue list by source class;
- final note on owner-review-needed items.

## 5. Review gate policy

Batch review items:
- `Смысл изменения`: first decide whether the field belongs in visible user-facing form at all.
- `Основной файл` vs `Файлы галереи`: decide if the blocks are distinct or redundant.
- `Тип проекта`: decide whether it is taxonomy/reference/select or needs a helper.
- `Канонический адрес`: decide whether it remains user-facing or only gets a helper.
- `Пользователи`: choose the best main-content CRUD pattern, but do not reopen the shell family or move it into the support rail.

Do not ask for approval on every micro label.
Collect one packet per wave and approve once.

## 6. Provisional helper text

Rule:
- orientation helpers for screens may ship autonomously;
- semantics-defining helpers for fields only ship after the boundary decision is made.

If the fields stay visible, these helpers are good starting points:
- `Медиа`: `Медиа — это библиотека исходных файлов. Здесь загружают и редактируют отдельные изображения и другие ассеты, которые потом используются в галереях, кейсах и страницах.`
- `Галереи`: `Галерея — это подборка из уже загруженных медиа. Здесь выбирают файлы, задают порядок и собирают альбом для нужного материала.`
- `Основной файл`: `Основной файл — это главный кадр галереи. Он используется как первое изображение в карточке и в превью.`
- `Канонический адрес`: `Канонический адрес — это основной адрес страницы, который будет использоваться в ссылках и поиске.`
- `Смысл изменения`: `Что изменилось в этой версии и зачем.`

If a field is actually internal workflow noise, the better fix may be to remove it from the visible form instead of renaming it.

## 7. Handoff

Next implementation prompt should focus first on Wave 1 and Wave 1b:
- `Проверка` as a preview-linked review surface;
- `Настройки` as a calmer status-heavy editor;
- `Главная` as a more compact operational landing packet.
- `Пользователи` as the immediate CRUD follow-up, before the repeated editor family.

After that, move in family order:
- `Медиа` / `Галереи`
- `Страницы` / `Кейсы` / `Услуги`

This plan is intentionally narrow: it assumes the shared shell is already in place and only finishes the remaining user-facing clarity work.
