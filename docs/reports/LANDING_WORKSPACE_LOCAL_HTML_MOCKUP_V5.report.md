# LANDING_WORKSPACE_LOCAL_HTML_MOCKUP_V5

## Scope
Собран `v5` как refinement поверх `Codex v4`. База структуры и поведения сохранена из `v4`: одна центральная рабочая page surface, явная библиотека материалов и компактный правый rail. Из Claude-версии взяты только локальные calming-правки по ритму, тону панелей и общему первому впечатлению.

## Deliverables
- `artifacts/landing-workspace-mockup-v5.html`
- `docs/reports/LANDING_WORKSPACE_LOCAL_HTML_MOCKUP_V5.report.md`

## What Changed From Codex V4
Относительно `v4` изменено следующее:
- верхняя панель стала тише: меньше визуального веса, меньше pill/chip ощущения, спокойнее строка источника;
- библиотека материалов осталась явной, но стала менее CRUD-похожей и чуть легче по плотности;
- центр стал более page-like: секции меньше ощущаются как отдельные admin-panels и больше как части одной страницы;
- bridge/copy стал мягче и редакторски спокойнее, с меньшим ощущением “input-row”;
- правый rail стал легче за счёт более мягких panel surfaces и скрытия selection-context в preview mode.

## What Was Consciously NOT Changed
Сознательно не менялось из `Codex v4`:
- одна центральная working page surface;
- отсутствие отдельного composition rail;
- явная логика `Добавить / Убрать / Добавлено`;
- явный used-state материалов;
- direct selection блока прямо на странице;
- bounded reorder, prominence, density и in-place actions;
- компактный helper без chat-модели.

Это сохранено намеренно, чтобы refinement не сделал прототип визуально приятнее, но слабее как рабочий инструмент.

## What Was Borrowed From Claude V4
Из Claude-донора взяты только мягкие визуальные приёмы:
- более спокойный ритм page surface;
- менее тяжёлое ощущение панелей;
- более мягкое разделение секций страницы;
- более спокойное первое впечатление от top bar и right rail;
- чуть более editorial ощущение connective copy.

Интеракционные паттерны Claude, которые ухудшали operational clarity, специально не переносились.

## How The Center Became More Page-Like
В `v5` центр по-прежнему интерактивен, но ощущается ближе к странице, чем к stack of widgets:
- обычные секции стали менее boxy и менее panel-like;
- featured / supporting / tinted состояния читаются через page rhythm, а не только через “коробки”;
- preview mode сильнее убирает ощущение управления и оставляет чтение;
- connective copy больше похож на короткий редакторский мостик между секциями, а не на отдельный control-row.

## How Top Bar And Right Rail Were Lightened
Top bar:
- сохранены page identity, compact status и 2 ключевых действия;
- убрана лишняя визуальная тяжесть;
- `Страница-источник` теперь выглядит спокойнее и менее chip-like.

Right rail:
- `Проверка`, handoff и helper сохранены;
- surfaces стали мягче;
- selected-block context скрывается в preview mode и не висит лишним административным блоком.

## How The Library Stayed Explicit But Calmer
Library по-прежнему даёт быстрый ответ на вопрос, что уже на странице:
- `Добавлено` и `Убрать` остались;
- `главный` для главного proof остался;
- used/not-used состояние читается сразу;
- при этом элементы стали чуть спокойнее и меньше похожи на CRUD-строки.

## How Connective Copy Was Softened
Connective copy остался page-scoped и inline, но стал мягче:
- меньше похоже на field-row;
- больше похоже на короткую editorial-связку между секциями;
- edit affordance по-прежнему есть, но визуально он не перетягивает внимание с самой страницы.

## Local Opening
Открыть локально можно двойным кликом по файлу:
- `artifacts/landing-workspace-mockup-v5.html`

Либо открыть этот файл в браузере как обычный локальный HTML-документ.
