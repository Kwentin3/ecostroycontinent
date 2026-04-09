# LANDING_WORKSPACE_LOCAL_HTML_MOCKUP_V6

## Scope
Собран `v6` как UI-refinement поверх `landing-workspace-mockup-v5.html`. Продуктовая модель не менялась: слева остаются reusable материалы, в центре одна рабочая page surface, справа компактные `Проверка` + handoff + небольшой helper.

## Deliverables
- `artifacts/landing-workspace-mockup-v6.html`
- `docs/reports/LANDING_WORKSPACE_LOCAL_HTML_MOCKUP_V6.report.md`

## What Changed From V5
Главные изменения относительно `v5`:
- library rows стали спокойнее, но при этом operationally clearer;
- семейства материалов теперь читаются по цветовым маркерам и icon/thumb cues, а не только по тексту;
- media получили более живые мини-preview вместо абстрактных плейсхолдеров;
- primary action в library стал компактным icon-led control, а не тяжёлой текстовой кнопкой;
- центр получил более выраженный `paper on desk` эффект;
- hover и selected состояния блоков стали яснее и разделены сильнее;
- block actions больше не раскрываются просто по клику на блок: вторичные действия ушли в явный `⋯`;
- preview mode стал чище: editing affordances и action chrome исчезают заметнее.

## Left Library Refinement
Library была переработана по четырём линиям:

1. Family differentiation
- `media`, `services` и `cases` теперь различаются через маленький цветовой маркер и разный характер thumb/icon;
- это убирает зависимость от тяжёлых текстовых family labels.

2. Media previews
- media items показывают более похожий на реальный preview thumb;
- gallery/media объекты больше не выглядят как одинаковые абстрактные квадраты.

3. Used-state
- `Добавлено` и `главный` остаются явно видимыми;
- used/not-used состояние читается сразу.

4. Action contract
- карточка сама по себе только фокусирует материал;
- primary action живёт в отдельной компактной icon-кнопке `+ / −`;
- whole-card click не открывает скрытое action-menu.

## How Family Differentiation Is Represented
Семейства показаны мягко, без агрессивной заливки всей карточки:
- `media` — тёплый photo-like accent;
- `services` — более спокойный оливковый family cue;
- `cases` — прохладный blue/steel cue.

Это сделано через:
- маленький family dot;
- характер thumb;
- лёгкий family tint only where helpful.

## How Media Previews Are Shown
В `v6` media cards больше не используют только абстрактную нейтральную заливку.

Теперь там:
- у `Главный фасад` — небольшой image-like thumb;
- у `Ход стройки` — компактный gallery-like preview.

Цель была не фотореалистичность, а быстрое визуальное различение media objects.

## How Action Controls Were Lightened
Action controls стали легче и яснее:
- в library primary action теперь icon-led и компактный;
- в page blocks secondary actions больше не торчат открытым strip;
- на блоке есть явный `⋯`, который открывает bounded menu действий;
- click по блоку теперь только выделяет его.

Это убирает competing interaction contracts.

## How The Center Became More "Paper On Desk"
Центральная страница усилена как рабочий лист:
- вокруг страницы больше ощущается desk/surface;
- сама page sheet белее и отделена тенью;
- есть внешний отступ между surrounding surface и page sheet;
- визуально легче понять, что именно этот лист является рабочим canvas страницы.

## Hover And Selected States
В Compose mode:
- hover даёт restrained dashed outline;
- selected state даёт уже solid accent frame и ощущение editing focus;
- `⋯` появляется только как явная secondary affordance на hover/selection.

В Preview mode:
- dashed outline исчезает;
- solid editing frame исчезает;
- `⋯` и action-menu исчезают;
- page остаётся только как reader-facing surface.

## What Was Intentionally Not Changed
Сознательно не менялись:
- one central page surface;
- отсутствие composition rail;
- библиотека как явный рабочий materials tray;
- `Добавлено / Убрать / Добавить` logic;
- bounded reorder / prominence / density / surface;
- компактный helper вместо chat;
- product model в целом.

Это refinement pass, а не новая концепция.

## Local Opening
Открыть локально можно двойным кликом по файлу:
- `artifacts/landing-workspace-mockup-v6.html`

Либо открыть файл в браузере как обычный локальный HTML-документ.
