# LANDING_WORKSPACE_LOCAL_HTML_MOCKUP_V1

## Scope
Сделан один локальный self-contained mockup для оценки Track 1 идеи как продукта и интерфейса, без backend, без build-step и без production-логики.

## Deliverable
- `artifacts/landing-workspace-mockup-v1.html`

## Screen Model
Выбран экран `library left / story rail + large preview center / compact helper + blockers right`.

Это поддерживает нужный операторский маршрут:
1. выбрать материалы
2. собрать story flow
3. усилить акценты
4. прочитать большой предпросмотр
5. увидеть blockers
6. передать на проверку

## Layout Structure
- Верхняя зона: идентичность страницы, компактное состояние, ссылка на `Страницу-источник`, действия `Сгенерировать заново` и `Передать на проверку`.
- Левая колонка: библиотека доказательств из `media`, `service cards`, `case cards`, плюс summary по shell.
- Центр: bounded story rail и большой `Предпросмотр` с переключением `Compose / Preview`.
- Правая колонка: компактный bounded helper, summary проверки и контекст выбранного блока.

## Bounded Composition
Композиция показана как story rail, а не как свободный canvas и не как мёртвый fixed-slot form.

Что зафиксировано:
- `Hero` остаётся первым.
- `CTA band` остаётся последним.
- `Header` и `Footer` показаны как shell regions, а не как обычные блоки.

Что гибко:
- proof-блоки в середине можно переставлять вверх/вниз;
- у блоков есть bounded controls для акцента и подачи;
- connective copy редактируется прямо внутри потока.

## Helper Interactions
Полноценный чат намеренно не моделировался.

В mockup helper представлен как компактная правая зона и drawer с ограниченными действиями:
- `Rewrite this`
- `Сделать сильнее`
- `Suggest transition`
- `Объяснить, что мешает`

Helper всегда подчинён текущему блоку и не перехватывает основной workflow.

## Block Controls
Контролы показаны как лёгкая и контекстная система:
- выбор блока в story rail;
- floating toolbar возле выбранного блока;
- inline textarea для connective copy;
- bounded reorder `Выше / Ниже`;
- cycling presets для `prominence`, `density`, `surface`;
- компактный правый контекст-блок с состоянием выбранного элемента.

## Intentionally Simplified
Сознательно упрощены или исключены:
- backend и сохранение;
- реальные generate/review маршруты;
- глубокая verification-диагностика;
- технические runtime-данные;
- мобильная детализация beyond adaptive collapse;
- production-точность дизайна.

## Local Opening
Открыть локально можно двойным кликом по файлу:
- `artifacts/landing-workspace-mockup-v1.html`

Либо открыть этот файл в браузере как обычный локальный HTML-документ.
