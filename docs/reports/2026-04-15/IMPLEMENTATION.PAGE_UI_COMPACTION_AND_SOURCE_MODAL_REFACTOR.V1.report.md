# IMPLEMENTATION.PAGE_UI_COMPACTION_AND_SOURCE_MODAL_REFACTOR.V1

Дата: 2026-04-15

## Что изменено

- Реестр страниц переведен в компактный режим без большого объясняющего hero-блока.
- Верх реестра теперь отдает первый экран под статистику, фильтры, поиск и действия.
- Карточки страниц больше не притворяются карточками медиа: вместо этого они показывают собственный page-preview surface.
- Единый экран страницы уплотнен по структуре и действию.
- Управляющие действия вынесены в header: `Превью`, `Метаданные`, `История`, `Проверка`, `Жизненный цикл`, `Передать на проверку`, `Сохранить страницу`.
- Левая колонка страницы возвращена к launcher-паттерну:
  - компактные launchers,
  - большой modal picker для каждого семейства,
  - отдельный quick context по уже выбранным источникам.
- Preview-резолвер страницы больше не ограничен только published media map:
  - draft-selected hero media теперь подмешивается в resolver через `mediaOptions`,
  - это закрывает кейс, когда в preview не появлялось только что выбранное изображение.
- Медиа-контракт страницы расширен до управляемой модели подачи:
  - страница хранит `mediaSettings`,
  - настраиваются режим главного изображения, раскладка галереи, aspect ratio карточек, группировка по коллекциям и показ подписей,
  - preview и публичный renderer читают один и тот же bounded contract.
- Дублирование page title между shell header и внутренним workspace смягчено:
  - shell заголовок для страницы возвращен к доменному уровню `Страницы`,
  - локальный workspace остается рабочей шапкой для самой страницы.

## Файлы

- `app/admin/(console)/entities/[entityType]/page.js`
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
- `components/admin/PageRegistryClient.js`
- `components/admin/PageRegistryClient.module.css`
- `components/admin/PageWorkspaceScreen.js`
- `components/admin/PageWorkspaceScreen.module.css`
- `components/public/PublicRenderers.js`
- `components/public/public-ui.module.css`
- `lib/content-core/page-media.js`
- `lib/content-core/pure.js`
- `lib/content-core/schemas.js`
- `lib/admin/page-workspace.js`
- `tests/admin/page-workspace-layout-guardrails.test.js`
- `tests/admin/page-workspace-remediation.test.js`
- `tests/content-core.service.test.js`
- `tests/public-page-media-layouts.test.js`

## Проверка

Локально до доставки:

- `npm test`
- `npm run build`

Попытка локального browser smoke через Playwright на `http://127.0.0.1:3000/admin/login` показала, что локальный runtime не имеет доступной БД на `localhost:5433`, поэтому авторизация для реального UI-smoke на локалке была невалидна как среда проверки.

Следствие:

- build и тесты подтверждают кодовую целостность рефакторинга;
- живой визуальный smoke должен быть подтвержден уже на серверной среде после выката.
