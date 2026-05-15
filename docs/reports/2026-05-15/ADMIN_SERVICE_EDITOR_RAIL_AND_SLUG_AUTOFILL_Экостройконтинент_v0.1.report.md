# Admin Service Editor Rail and Slug Autofill - Экостройконтинент v0.1

Дата: 2026-05-15
Branch: `ui/service-editor-rail-slug-refactor`
Commit: см. `git log -1 --oneline` после доставки

## Executive Verdict

Рефакторинг редактора карточки услуги выполнен консервативно: верхняя дублирующая плашка для обычных сущностей убрана, рабочие статусы и основные действия перенесены в правую панель, а короткий адрес для маршрутизируемых сущностей автоматически заполняется транслитерацией из названия до первого ручного изменения.

Изменение не трогает page workspace: страницы остаются в отдельном потоке, потому что у них есть фиксированные маршруты и отдельная модель метаданных.

## UI Audit: Right Rail Gap

До изменения верхняя рабочая зона дублировала правую панель:

- версия карточки;
- рабочий статус;
- статус публикации;
- готовность;
- primary action сохранения;
- действия проверки, публикации и истории.

В правой панели уже были readiness, связанные данные и публикационная история, но не хватало единого summary и первичных действий. После рефакторинга right rail закрывает этот набор:

- `Состояние карточки`: название, краткое описание, версия, рабочий статус, публикация, готовность;
- actions: сохранить черновик, отправить на проверку, открыть проверку, открыть публикацию, история, возврат к источнику;
- service actions: карантин удаления, снятие с публикации, test graph, legacy delete оставлены во вторичном disclosure;
- readiness, related data diagnostics и история остаются ниже как вторичные панели.

На мобильном viewport правая панель поднимается выше формы, чтобы оператор сначала видел состояние и действия, а затем редактировал данные.

## Implemented

Runtime / UI:

- `components/admin/EntityEditorForm.js`
  - удалены `editorHero` и `editorToolbar`;
  - добавлен `editorStatusPanel` в правую панель;
  - основные действия перенесены в `editorRailActions`;
  - служебные действия перенесены в right rail disclosure.
- `components/admin/admin-ui.module.css`
  - удалены стили старой верхней плашки;
  - добавлены стили status rail, status list, rail actions;
  - мобильная раскладка поднимает rail вверх.
- `app/admin/(console)/entities/[entityType]/[entityId]/page.js`
  - для обычных сущностей верхний action `Вернуться к источнику` убран из `AdminShell`;
  - `returnTo` передаётся в `EntityEditorForm`.
- `app/admin/(console)/entities/[entityType]/new/page.js`
  - новый редактор использует тот же right rail pattern.

Slug logic:

- `lib/utils/slug.js`
  - добавлены `transliterateToLatin` и `normalizeSlug`;
  - кириллица переводится в латиницу, unsafe separators становятся `-`, повторные разделители схлопываются.
- `components/admin/SlugTitleFields.js`
  - общий client-control для пары `slug/title`;
  - пустой slug автозаполняется из названия;
  - ручное изменение slug блокирует дальнейшую автоподмену;
  - существующий slug считается ручным по умолчанию, чтобы правка названия не меняла URL без явного действия.
- `components/admin/EntityTruthSections.js`
  - service, equipment и case используют общий `SlugTitleFields`.
- `lib/content-core/pure.js`
  - server-side normalization использует тот же `normalizeSlug`;
  - ручной latin slug имеет приоритет перед fallback из title/h1.

Tests:

- `tests/slug-normalization.test.js`
- `tests/content-core.service.test.js`
- `tests/admin/entity-editor-refactor-ui.test.js`

## Behavioral Contract

Slug autofill:

1. Если оператор заполняет название, а короткий адрес пустой, slug появляется автоматически: `Аренда спецтехники` -> `arenda-spetstekhniki`.
2. Если оператор меняет slug вручную, дальнейшие изменения названия не переписывают slug.
3. Если slug очищен и поле потеряло фокус при заполненном названии, slug снова заполняется из названия.
4. На сервере пустой slug также нормализуется из title/h1 перед persistence boundary.
5. Существующие опубликованные slug не переписываются при открытии карточки.

Right rail:

1. Оператор видит состояние карточки и основные действия в одном правом блоке.
2. Верхняя плашка больше не дублирует правую панель.
3. Служебные действия не занимают основной рабочий поток.
4. Сообщения `message/error` сохранены над формой, потому что это transient feedback после submit/redirect.

## UI Integrity Notes

- Visual hierarchy стала одноканальной: слева форма данных, справа состояние, проверка, публикация и history.
- Основные действия доступны из rail без прокрутки верхней формы.
- Secondary/rare actions скрыты в disclosure, но не удалены.
- Business logic не уехала в CSS/UI: `SlugTitleFields` управляет только draft UX, а `lib/content-core/pure.js` нормализует данные перед сохранением.
- Page workspace не затронут, чтобы не смешивать fixed page route semantics с entity slug semantics.

## Verification

Targeted tests:

```powershell
node --test tests/slug-normalization.test.js tests/content-core.service.test.js tests/admin/entity-editor-refactor-ui.test.js
```

Result: passed, 25/25.

Full suite:

```powershell
npm test
```

Result: passed, 492/492.

Build:

```powershell
npm run build
```

Result: passed, Next standalone build produced `.next/standalone`.

Closed-world evidence:

- `.next/standalone/package.json` содержит только runtime dependencies из проекта; `package.json` и `package-lock.json` не менялись.
- `.next/standalone/server.js` и `.next/standalone/.next/server/*` собраны.
- `rg "SlugTitleFields|normalizeSlug|arenda-spetstekhniki" .next/standalone/.next/server -g "*.js"` находит новый client-control и shared slug utility в build artifact.

Failure attribution during verification:

- Первый targeted run поймал, что `/services/Аренда спецтехники/` нормализовался как `servicesarenda-spetstekhniki`.
- Причина: unsafe separator `/` удалялся, а не превращался в `-`.
- Исправление: unsafe characters are converted to `-` before separator collapse.
- Повторный targeted run прошёл.

## Deployment Notes

Нет новых зависимостей, migrations, env variables или runtime services.

После merge/deploy требуется smoke check production admin route:

- доменный `/admin`;
- карточка услуги `Аренда спецтехники`;
- right rail содержит `Состояние карточки`;
- старые `editorHero/editorToolbar` не должны быть в markup;
- slug autofill проверяется на новой service/equipment/case карточке или через тестовый draft без публикации.
