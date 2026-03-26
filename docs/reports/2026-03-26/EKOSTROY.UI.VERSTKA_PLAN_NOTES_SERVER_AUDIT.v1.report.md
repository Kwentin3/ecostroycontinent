# EKOSTROY.UI.VERSTKA_PLAN_NOTES_SERVER_AUDIT.v1

## Executive summary

План и заметки в целом совпадают по направлению, а живой сервер уже реализовал большую часть каркаса и role-facing grammar. При этом сервер всё ещё не довёл до конца несколько смысловых и контентных границ: `Смысл изменения`, taxonomy-like поля вроде `Тип проекта`, а также runtime/content residue в публичных и внутренних proof-данных.

Главный вывод:
- shell grammar уже доехала на сервер: глобальная навигация слева, depth/breadcrumb сверху, support/status rail справа;
- `Проверка` реально стала decision packet surface;
- `Пользователи` реально стали lighter CRUD в main content area;
- story editor family (`Страницы`, `Кейсы`, `Услуги`) есть на сервере и разделяет общий паттерн;
- `Медиа` и `Галереи` объясняют себя лучше, но всё ещё несут много proof/data noise;
- public web still leaks proof content / English strings, so code-side RU-only ≠ fully clean live content.

## What was in the plan

Канонические постуры плана:
- левая панель = только глобальная навигация;
- верхняя depth/breadcrumb bar = вложенность внутри текущего family;
- правый rail = support/status only;
- `Проверка` = primary owner-facing decision packet surface;
- `Пользователи` = lighter CRUD в main content area, без nested editor grammar;
- `Страницы`, `Кейсы`, `Услуги` = repeated story editor family;
- `Медиа`, `Галереи` = media pack;
- helper texts делятся на orientation helpers и semantics-defining helpers, где вторые требуют boundary decision.

Это видно в плане по разделам про wave-structure и canonical navigation posture.

## What was in the notes

В заметках были зафиксированы реальные UX наблюдения с экранов:
- `Проверка` должна показывать связь поле -> preview, device toggle и readiness выше в иерархии;
- before/after длинных изменений иногда лучше читать stacked, а не side-by-side;
- `Пользователи` не должны уезжать в right rail или nested editor grammar;
- `Медиа` и `Галереи` нуждаются в короткой экранной легенде;
- `Файлы галереи` и `Основной файл` выглядят как потенциально пересекающиеся концепции;
- `Смысл изменения`, `Тип проекта`, `Короткий адрес`, `Канонический адрес` требуют boundary decision, а не только rename;
- `Быстрая загрузка медиа` в story editors выглядит как candidate anti-pattern;
- runtime / proof noise нужно отделять от layout judgment;
- старые layout-альтернативы перенесены в historical appendix и объявлены non-executable.

## What is actually on the server now

### 1. Shell / navigation

Живой `/admin` подтверждает canonical shell:
- слева только глобальная навигация;
- сверху есть `Навигация по уровням`;
- справа support/status rail;
- на dashboard сейчас компактная операционная стартовая поверхность, а не длинная sparse-страница.

### 2. Проверка

Живой `/admin/review` и detail-экран проверки соответствуют плану лучше всего:
- это уже `primary owner-facing decision packet surface`;
- readiness поднята выше в иерархии;
- preview-link rows уводят к конкретным блокам превью;
- есть переключение `Компьютер / Планшет / Телефон`;
- action set на карточке решения короткий и понятный;
- diff presentation читается как decision packet, а не как длинная таблица.

### 3. Пользователи

Живой `/admin/users` и detail-card уже выглядят как lighter CRUD:
- есть таблица пользователей с колонкой `Карточка`;
- `Редактировать` открывает отдельную карточку;
- detail содержит `Сохранить изменения`, `Удалить пользователя`, `Активен`, `Роль`, `Новый пароль`;
- размещение осталось в main content area, не в right rail и не в nested editor grammar.

Это совпадает с планом и закрывает главный carry-over по users.

### 4. Media / Gallery

Живые detail-экраны показывают, что смысловая рамка уже стала лучше, но не до конца:
- `Медиа` объясняет себя как источник исходных файлов;
- `Галерея` объясняет себя как подборка / коллекция уже загруженных медиа;
- на `Галерее` легенда уже присутствует и реально помогает ориентации;
- на `Медиа` пояснение тоже есть, но общий экран всё ещё перегружен proof-ассетами и быстрым upload flow;
- `Файлы галереи` и `Основной файл` остаются двумя отдельными зонами, и их различие ещё не выглядит идеально прозрачным.

### 5. Story editor family: Страницы / Кейсы / Услуги

Живые detail-экраны уже реализуют общий shared grammar:
- левая часть — основной контент;
- правая часть — готовность, published version, audit;
- helper copy объясняет, что новые файлы добавляются через `Медиа`, а не внутри каждой карточки;
- `Страницы` присутствуют в таком же семействе, как `Кейсы` и `Услуги`.

При этом there are still gaps:
- `Смысл изменения` всё ещё visible на всех этих экранах;
- `Тип проекта` в `Кейсах` остаётся свободным текстовым полем, хотя по смыслу выглядит как taxonomy/reference;
- `Короткий адрес` и `Канонический адрес` остаются технически корректными, но не до конца friendly;
- `Основной файл` в `Галерее` всё ещё требует явной boundary clarification.

### 6. Public web

Public side пока не стал fully clean live content surface:
- `/` выглядит как минимальный публичный stub с `В разработке`;
- `/services` уже русифицирован по shell, но контент там всё ещё proof-based;
- public service detail показывает `Proof Service...`, `Proof service summary`, `Drainage-related proof problem` и другие English strings;
- следовательно, кодовая RU-only поверхность существует, но данные / fixtures ещё не доведены до clean public content.

## Main discrepancies

### Closed in live server

- global nav / breadcrumb / right rail grammar;
- review decision packet structure;
- users as lighter CRUD;
- role-aware dashboard;
- shared shell for story editor family;
- page / case / service family exists on server;
- gallery explanation improved;
- media explanation improved enough to work as source library.

### Still only partly done

- `Медиа` list pages do not yet carry a very explicit tiny orientation legend; legend is mostly on detail screens;
- `Файлы галереи` vs `Основной файл` still need stronger semantic boundary;
- `Смысл изменения` remains user-facing everywhere it appears;
- `Тип проекта` is still a free-text box on cases;
- `Короткий адрес` / `Канонический адрес` still need more contextual help or boundary decisions;
- public content is still proof-laden and English-heavy in places;
- media-related 404s / missing assets still appear on nested screens.

## Residual runtime / content issues

These should be treated as data/content residue, not layout bugs:
- `Proof ...` entity names on public and admin lists;
- English summaries and copy in proof fixtures;
- missing media asset requests on nested detail pages;
- proof gallery / proof case / proof service placeholders that are still visible live.

## Final assessment

If we compare the three layers:

- **Plan** already canonized the shell grammar and the role/model boundaries.
- **Notes** correctly captured the concrete UX pain points and the field-meaning ambiguity.
- **Live server** now implements most of the shell and workflow grammar, but still leaves some field semantics and runtime content residue unresolved.

So the current state is:
- **implemented**: shell grammar, decision packet surface, lighter CRUD users, shared story-editor family, clearer media/gallery explanation;
- **partial**: screen legends on all surfaces, gallery/media boundary clarity, field semantics around `Смысл изменения` and `Тип проекта`;
- **not yet done**: clean public content without proof residue, media/runtime cleanup, and final semantic boundary decisions for the ambiguous fields.

## Recommended next narrow step

1. Finish the runtime/content sweep for proof fixtures and media references.
2. Make a boundary decision on `Смысл изменения`, `Тип проекта`, `Канонический адрес`, `Короткий адрес`, `Основной файл`.
3. Decide whether the remaining screen legends should live as tiny orientation blocks on list pages, or only on detail screens.

