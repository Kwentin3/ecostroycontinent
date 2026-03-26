# EKOSTROY.UI.VERSTKA_CARRYOVER_DELIVERY.v1

Статус: delivered and live-verified

## To-do

1. Добавить экранные легенды для ключевых admin surfaces.
2. Упростить copy на `Проверка`, `Пользователи`, `Медиа`, `Галереи`, `Кейсы`, `Услуги`, `Страницы`.
3. Заменить `Смысл изменения` на человеческий термин и добавить helper text.
4. Дать `Канонический адрес` и `Тип проекта` короткий контекст и безопасные подсказки.
5. Подсветить разницу между `Медиа` как библиотекой исходников и `Галереи` как подборкой.
6. Проверить, что изменения реально доехали на сервер.

## Что реализовано

- Добавлен thin shared copy layer `lib/admin/screen-copy.js`.
- На top packets добавлены `legend`-подписи для:
  - dashboard
  - review queue
  - review detail
  - publish readiness
  - users list
  - users detail
  - entity list pages
  - entity editor family
  - history pages
- `Смысл изменения` заменён на `Комментарий к правке`.
- В `Проверка` обновлена формулировка комментария и подсказка про preview.
- В `Пользователи` сохранён lighter CRUD pattern в main content area.
- В `Медиа` и `Галереях` добавлены orientation legends.
- Для gallery/service/case/page media pickers добавлены helper hints.
- Для `Канонический адрес` добавлена короткая поясняющая подсказка.
- Для `Тип проекта` добавлен datalist со значениями из существующих кейсов, но только для значений с кириллицей.

## Проверка

### Local

- `npm run build` ✅
- `npm test` ✅

### Commit / push / deploy

- Commit: `e8c7479` `feat: add admin screen legends and field hints`
- Push: `origin/main` ✅
- Build workflow: `23605791668` ✅
- Deploy workflow: `23605915794` ✅
- Deployed image ref: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:1ff9b019ee6d9dc262b0e57527d2b363c6835ee495efe4fe5f2370d2b8be44ca`

## Live routes checked

- `/admin`
- `/admin/review`
- `/admin/review/rev_ec990634-3e1e-43d9-9ace-478390d74c44`
- `/admin/users`
- `/admin/users/user_bd7807a0-8244-4c1e-8d65-80c0faeaef5c`
- `/admin/entities/media_asset`
- `/admin/entities/media_asset/entity_a8dc1068-bea5-4385-aa83-3ed110fc2f65`
- `/admin/entities/gallery/entity_e8869ac0-97e8-4900-8c5a-baac6f7613c4`
- `/admin/entities/case`
- `/admin/entities/case/entity_2ca905c5-1210-4845-b091-98c3d3a3130d`
- `/admin/entities/service`
- `/admin/entities/service/entity_05c6d1ba-bb24-41ca-a588-23f0d51b790d`
- `/admin/entities/page/entity_8f65c696-9ae9-40f7-a414-5062f9ebba4e`

## Residuals

- `Proof ...` data remains in runtime fixtures and seeded content.
- 404 media requests still appear on proof surfaces; this is a separate runtime/content sweep, not a shell/layout regression.

## Evidence files

- `docs/reports/2026-03-26/live-admin-dashboard-legend-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-review-detail-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-users-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-user-detail-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-media-list-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-media-detail-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-case-list-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-case-detail-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-service-list-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-service-detail-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-gallery-detail-after-deploy.png`
- `docs/reports/2026-03-26/live-admin-page-detail-after-deploy.png`
