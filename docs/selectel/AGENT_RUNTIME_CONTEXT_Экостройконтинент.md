# Agent Runtime Context - Экостройконтинент

Статус: короткая памятка для агентов.
Обновлено: 2026-06-11.

## Главное

- Workspace агента не является production runtime.
- В workspace может не быть локальной PostgreSQL базы. `ECONNREFUSED` от локального Postgres не доказывает поломку сайта или отсутствие опубликованного контента.
- Фактическая production truth проверяется через deployed runtime: сервер, публичный сайт, админку, `/api/health`, `/api/readiness`, smoke-команды.
- Без явного запроса не выполняй production-mutation: не публикуй, не мигрируй, не чисти данные, не меняй env.
- При deploy-проверках верь live `/api/readiness`, а не имени ветки или старой заметке.

## Что читать в этой папке

- `docs/selectel/README.md` - индекс и границы папки.
- `docs/selectel/RUNBOOK.Infrastructure_Operations_Baseline_Экостройконтинент_v0.2.md` - актуальный Selectel/runtime runbook.
- `compose.yaml` и `.env.example` - актуальный compose/env contract в репозитории.

Старые provisioning-аудиты, review notes, v0.1-контракты и промежуточные gaps удалены из `docs/selectel`, чтобы не конфликтовать с текущим runbook.

## Runtime Boundaries

Разделяй четыре слоя:

1. Code/schema contract в репозитории.
2. Возможности локального workspace.
3. Deployed runtime на Selectel VM.
4. Фактический опубликованный контент в production data.

`Service`, `Case`, `MediaAsset`, `Gallery`, `Equipment` могут быть корректными в коде, даже если локальная БД недоступна.

## Published Content Checks

Для задач про опубликованные услуги, кейсы, медиа, технику, страницы и карточки:

- сначала проверь code/schema contract;
- затем, если нужен фактический inventory, проверяй deployed runtime read-only способом;
- не делай вывод "контент отсутствует" только из локальной ошибки подключения к БД;
- не создавай отдельный публичный `/equipment` domain без отдельного продуктового решения;
- не храни raw CDN URLs как editorial truth в контенте.

## Media/CDN Rule

Production media truth:

- metadata и publish-state живут в PostgreSQL;
- binaries живут в S3-compatible Selectel storage;
- CDN URL является delivery output, а не source of truth;
- public read-side в CDN-capable режиме должен рендерить прямые Selectel CDN URLs для опубликованных медиа;
- `/api/media-public/:entityId` остается fallback/handoff route.

Для админки не открывай draft/review media через CDN без отдельного решения: неопубликованные версии должны оставаться за авторизованными admin preview routes.

## Backup/Restore Rule

Production backup truth:

- DB backup автоматизирован на VM и перед миграциями в deploy workflow;
- текущий DB dump является SQL+gzip с checksum и S3 upload, но это не WAL/PITR;
- restore сначала проверяется в disposable PostgreSQL target;
- DB rollback не равен полному media rollback: бинарники живут в S3, поэтому media bucket versioning должен оставаться включённым;
- backup S3 env не передаётся в app container.

## SEO/Analytics

Для SEO Dashboard, Yandex Metrica/Webmaster, first-party analytics и LLM context начинай с:

- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`

Read model является consumer DTO boundary. UI/LLM не должны напрямую дергать Yandex/raw sources.

## Product Context

Перед аудитом структуры публичного сайта прочитай:

- `docs/product-ux/PRD_Экостройконтинент_v0.3.1.md`
- `docs/product-ux/Content_Contract_Экостройконтинент_v0.2.md`
- `docs/product-ux/Public_Launch_Domain_Canon_Экостройконтинент_v0.1.md`

Текущий канон:

- Services продают коммерческие направления.
- Equipment является supporting content для аренды техники.
- Cases доказывают выполненные работы.
- Media подтверждают услуги и кейсы через refs/IDs, не через raw URL truth.
