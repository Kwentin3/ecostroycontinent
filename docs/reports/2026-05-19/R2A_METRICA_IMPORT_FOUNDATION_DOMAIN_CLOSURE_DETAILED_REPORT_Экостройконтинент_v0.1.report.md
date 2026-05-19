# R2A Metrica Import Foundation Domain Closure Detailed Report

Дата: 2026-05-19
Проект: Экостройконтинент
Домен: R2A. Metrica Import Dry Run + Source Sync State + Minimal Daily Traffic/Goals
Русское название: Минимальный импорт агрегатов Яндекс Метрики: dry-run, source sync state, daily traffic/goals
Branch: `feat/r2a-metrica-import-foundation`
Closure commit before this report: `a1cb76c`
Runtime implementation commit: `6d5d976abcb086edb15b5c1a6a62a25d8876a5e8`
Runtime target: Selectel VM, compose stack `repo-app-1` + `repo-sql-1`, canonical env `/opt/ecostroycontinent/runtime/.env`

## Executive Verdict

R2A был закрыт как узкий, серверный, operator-triggered домен.

Фактически закрыто:

- добавлен server-only importer Яндекс Метрики;
- добавлен dry-run без записи в БД;
- добавлен write-import минимальных daily aggregates;
- добавлена таблица `external_metrica_daily_aggregate`;
- обновляется `analytics_source_sync_state` для `source_system = yandex_metrica`;
- доказана идемпотентность повторного запуска за тот же период;
- canonical runtime принял миграцию, dry-run, import и telemetry smoke;
- internal first-party telemetry осталась operational source of truth;
- Метрика осталась external aggregate enrichment, а не источником истины.

R2A можно считать закрытым. R2B/R2C, R3A, scheduled imports, read model integration, UI, LLM и lead/intake не реализовывались.

## Why This Report Exists

Уже созданы два формальных отчёта:

- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`

Этот дополнительный отчёт фиксирует ход закрытия домена: какие шаги были выполнены, где был найден acceptance blocker, как он был исправлен, какие проверки прошли, и почему closure считается корректным.

## Starting State

Перед реализацией R2A уже были подготовлены и приняты planning artifacts:

- `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- `docs/reports/2026-05-19/R2_R3_EXTERNAL_IMPORTS_REFINEMENT_Экостройконтинент_v0.1.report.md`

Ключевые ограничения на старт:

- R2A не должен делать весь R2;
- не должен добавлять scheduler;
- не должен менять `/admin/visibility`;
- не должен подключать read model;
- не должен импортировать high-cardinality dimensions;
- не должен использовать browser-side Yandex API;
- не должен хранить raw sessions, tokens, Authorization headers, form values, IP, user agent;
- не должен превращать Метрику в operational source of truth.

## Worktree And Branch Hygiene

Перед кодовой работой текущий docs-only state по R2/R3 был сохранён отдельным commit:

```text
4d938d2 docs: refine r2 r3 external imports
```

После этого работа велась в dedicated branch:

```text
feat/r2a-metrica-import-foundation
```

Это отделило уже принятые planning-документы от implementation commits R2A.

## Implementation Route

### 1. Storage Migration

Добавлена миграция:

```text
db/migrations/010_external_metrica_daily_aggregate.sql
```

Новая таблица:

```text
external_metrica_daily_aggregate
```

Назначение таблицы:

- хранить только внешние агрегаты Метрики;
- не смешивать эти данные с `analytics_event`;
- не подменять internal telemetry;
- оставить путь для R2B без переделки R2A.

Основной upsert key:

```text
source_system + date + report_type + dimension_hash + metric_key + goal_id
```

`goal_id` и `goal_name` для non-goal rows нормализуются в пустую строку, чтобы unique key был детерминированным.

### 2. Importer Modules

Добавлены server-side modules:

```text
scripts/yandex/import-metrica-aggregates.mjs
scripts/yandex/metrica-import-lib.mjs
```

Importer делает:

- env validation;
- counter/goal/report validation;
- safe request к Yandex Metrica Stat API;
- dry-run summary без DB writes;
- write import с upsert;
- update `analytics_source_sync_state`;
- safe error mapping;
- token redaction;
- idempotent rerun.

Команды добавлены в `package.json`:

```bash
npm run yandex:metrica-import:dry-run
npm run yandex:metrica-import:r2a
```

Обе команды поддерживают bounded date range:

```bash
npm run yandex:metrica-import:dry-run -- --date1=2026-05-16 --date2=2026-05-18
npm run yandex:metrica-import:r2a -- --date1=2026-05-16 --date2=2026-05-18
```

Default period: последние три полностью завершённых дня Europe/Moscow, заканчивая вчерашним днём.

### 3. API Plan

Использован server-side Reporting API plan:

Traffic report:

```text
dimension: ym:s:date
metrics: ym:s:visits, ym:s:pageviews, ym:s:users
```

Goal report:

```text
dimension: ym:s:date
metrics: ym:s:goal<goalId>reaches
```

Цели R2A:

- `click_to_call`
- `click_to_telegram`
- `click_to_whatsapp`
- `form_start`
- `form_submit`
- `cta_click`
- `contact_link_click`
- `gallery_open`
- `faq_expand`
- `case_card_click`
- `service_link_click`

Если `users` отклоняется API, importer умеет безопасно retry traffic report без `users` и пометить показатель как unavailable/partial. Если combined goal metrics fails, importer умеет isolate per-goal failures.

### 4. Source Sync State

R2A обновляет:

```text
analytics_source_sync_state
```

Для:

```text
source_system = yandex_metrica
```

Заполняются:

- `status`;
- `last_attempted_at`;
- `last_successful_at`;
- `imported_period_start`;
- `imported_period_end`;
- `rows_imported`;
- `safe_error_message`;
- `unmapped_url_count = 0`.

R2A не импортирует URL dimensions, поэтому unmapped URL diagnostics не создавались и не менялись.

## Commits

Implementation был сделан в два code commits:

```text
01ce96a feat: add r2a metrica aggregate import
6d5d976 fix: persist zero metrica aggregate days
```

Closure docs были добавлены отдельным commit:

```text
a1cb76c docs: close r2a metrica import foundation
```

## First Acceptance Finding

Первый build/deploy прошёл на commit:

```text
01ce96a
```

GitHub Actions:

```text
build-and-publish run: 26094189120
image digest: sha256:72f4e442ea578530c7b3913ad849d03e1e068f0ec7e354530d2d73917816471f
deploy run: 26094357891
```

На canonical runtime dry-run и import успешно обращались к API, но Yandex Reporting API вернул:

```text
api_rows = 0
total_rows = 0
totals = 0
```

Importer корректно обновил source state, но не записал aggregate rows. Это не удовлетворяло acceptance criterion "prove aggregate rows exist".

Вывод: API-доступ был рабочим, но R2A storage proof был неполным для периода с нулевыми totals.

## Fix For Empty API Rows With Zero Totals

Исправление сделано в commit:

```text
6d5d976 fix: persist zero metrica aggregate days
```

Решение:

- если API возвращает empty rows;
- и при этом totals явно равны нулю;
- importer создаёт explicit zero-valued daily aggregate rows за выбранный период;
- metadata помечает строки как zero-fill:

```text
zero_filled_from_empty_api_rows = true
zero_fill_reason = api_totals_zero
```

Ограничение:

- nonzero totals не распределяются искусственно;
- если API вернёт nonzero totals без rows, importer не подделывает daily rows и должен вернуть safe partial/failed state;
- нулевые external aggregate rows не трактуются как доказательство нулевых internal user actions.

Это conservative fix: он сохраняет честность внешнего aggregate слоя и даёт project storage proof для периода без активности в Метрике.

## Local Verification

После initial implementation:

```text
targeted tests: 26 pass
npm test: 534 pass
npm run build: pass
```

После zero-fill fix:

```text
tests/yandex-metrica-import-r2a.test.js: 11 pass
npm test: 535 pass
npm run build: pass
git diff --check: pass
```

Покрытые тестовые сценарии:

- missing env -> `not_configured`;
- dry-run writes nothing;
- successful import writes traffic and 11 goal aggregates;
- source sync state becomes `ok`;
- same-period rerun is idempotent;
- invalid metric/dimension maps to safe partial/failed state;
- rate limit/network/token errors are safely mapped;
- summaries do not leak secrets;
- migration shape has expected table/unique key and no raw/session/user columns;
- no browser/UI Yandex API calls;
- no public tracker to `/api/analytics/events`;
- no read model/UI dependency on imported Metrica rows.

## Final Build And Deploy

Final implementation build/deploy был выполнен после zero-fill fix:

```text
build-and-publish run: 26094575156
image digest: sha256:f21d1229d96fbbda9a89a43f4048ee839ae7454accca9a55f1c8b2a26299aec5
deploy run: 26094722406
runtime commit: 6d5d976abcb086edb15b5c1a6a62a25d8876a5e8
```

Canonical runtime:

```text
Selectel VM
compose stack: repo-app-1 + repo-sql-1
canonical env: /opt/ecostroycontinent/runtime/.env
```

Runtime readiness подтвердил:

```text
database = ok
commit = 6d5d976abcb086edb15b5c1a6a62a25d8876a5e8
buildTime = 2026-05-19T11:36:10Z
```

## Server Acceptance

### Env Presence

Проверено на canonical runtime без вывода секретов:

```json
{
  "YANDEX_METRICA_COUNTER_ID": "109037342",
  "YANDEX_METRICA_OAUTH_TOKEN": "present",
  "YANDEX_WEBMASTER_OAUTH_TOKEN": "present"
}
```

Значения токенов не выводились.

### Acceptance Period

Для acceptance выбран короткий завершённый период:

```text
2026-05-16..2026-05-18
```

Причина: не использовать today-only из-за возможной задержки Метрики; период завершённый и bounded.

### Dry-Run

Команда:

```bash
docker exec repo-app-1 npm run yandex:metrica-import:dry-run -- --date1=2026-05-16 --date2=2026-05-18
```

Результат:

```text
status = ok
rows_prepared = 42
rows_imported = 0
sync_state_written = false
api_rows = 0
total_rows = 0
sampled = false
sample_share = 1
data_lag = 0
```

Dry-run подтвердил:

- env/counter/token доступны;
- report plan валиден;
- 11 goal metrics выбраны;
- API отвечает;
- DB writes не выполняются.

### Write Import

Команда:

```bash
docker exec repo-app-1 npm run yandex:metrica-import:r2a -- --date1=2026-05-16 --date2=2026-05-18
```

Результат:

```text
status = ok
rows_prepared = 42
rows_imported = 42
sync_state_written = true
```

### DB Proof

В canonical SQL подтверждено:

```text
external_metrica_daily_aggregate rows for 2026-05-16..2026-05-18 = 42
```

По дням:

```text
2026-05-16: visits 1 row, pageviews 1 row, users 1 row, goal_reaches 11 rows
2026-05-17: visits 1 row, pageviews 1 row, users 1 row, goal_reaches 11 rows
2026-05-18: visits 1 row, pageviews 1 row, users 1 row, goal_reaches 11 rows
```

Все metric values за этот период равны `0.0000`, что является честным external aggregate result от Метрики, а не выводом о внутренней telemetry.

### Source Sync State Proof

Для `source_system = yandex_metrica`:

```text
status = ok
imported_period_start = 2026-05-16
imported_period_end = 2026-05-18
rows_imported = 42
unmapped_url_count = 0
safe_error_message = empty
```

### Idempotency Proof

Повторный запуск import за тот же период:

```text
status = ok
rows_before = 42
rows_after = 42
```

Вывод: upsert key работает, повторный запуск не создаёт дубли.

### Internal Telemetry Smoke

Internal telemetry проверена независимо от Метрики:

```bash
curl -ksS -X POST https://127.0.0.1/api/telemetry/events \
  -H 'Host: ecostroycontinent.ru' \
  -H 'Content-Type: application/json' \
  -d '{"event_name":"page_viewed","event_version":"1.0","page_path":"/","is_test":true,"metadata":{"page_kind":"r2a_smoke"}}'
```

Ответ:

```json
{"ok":true,"stored":true,"event_name":"page_viewed","journey_created":false}
```

DB proof:

```text
event_name = page_viewed
is_test = true
is_internal = false
page_path = /
```

Это доказывает, что R2A не сломал operational telemetry path. Этот smoke не использовался как доказательство Метрики.

## Security And Privacy Checks

Проверено:

- OAuth token values не печатались;
- refresh tokens не печатались;
- client secrets не печатались;
- Authorization headers не логировались;
- raw request dumps не сохранялись;
- raw response dumps с sensitive context не сохранялись;
- imported rows не содержат raw sessions;
- imported rows не содержат form values;
- imported rows не содержат IP/user agent;
- browser/client Yandex API не добавлен;
- direct UI -> Metrica API не добавлен;
- Webvisor/clickmap/session replay/ecommerce imports не добавлены;
- read model не читает `external_metrica_daily_aggregate`;
- `/admin/visibility` не менялся;
- scheduled jobs не добавлены.

## Boundary Checks

Проверено, что R2A не вышел за границы:

- нет integration в `lib/analytics/read-model.js`;
- нет UI dependency на imported Metrica table;
- нет новых browser-side calls to Yandex API;
- нет public tracker -> `/api/analytics/events`;
- нет scheduler/cron/workflow для import cadence;
- R3/Webmaster не реализовывался;
- LLM не трогался;
- lead/intake не трогался;
- Content Core не мутировался.

## What Was Changed

Code/storage:

- `db/migrations/010_external_metrica_daily_aggregate.sql`
- `scripts/yandex/import-metrica-aggregates.mjs`
- `scripts/yandex/metrica-import-lib.mjs`
- `tests/yandex-metrica-import-r2a.test.js`
- `package.json`

Docs:

- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_CONFORMITY_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/AGENT_START_HERE.md`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`
- `docs/integrations/YANDEX_SEO_DASHBOARD_BOOTSTRAP_Экостройконтинент_v0.1.md`

This report adds one more docs-only closure artifact:

- `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_DOMAIN_CLOSURE_DETAILED_REPORT_Экостройконтинент_v0.1.report.md`

## What Was Not Changed

Не реализовывалось:

- R2B traffic source/device/region/landing URL import;
- high-cardinality dimensions;
- scheduled Metrica import;
- read model integration;
- `/admin/visibility` UI;
- R3/Webmaster import;
- Google Search Console import;
- reconciliation with internal telemetry;
- lead/intake;
- LLM;
- visual heatmap;
- raw Metrica Logs API;
- Webvisor/clickmap/session replay import;
- ecommerce import;
- direct UI -> Metrica API;
- browser-side Yandex API calls;
- storing imported Metrica rows in `analytics_event`.

## Known Limitations

1. Acceptance period returned zero external activity from Metrica.

This is valid external data for the selected period, but it does not prove nonzero traffic/goal import. The importer still proves API access, report shape, storage, source state and idempotency.

2. R2A does not enrich `/admin/visibility`.

This is intentional. Read model enrichment belongs to R4 after imported rows and source state are accepted.

3. R2A does not schedule recurring imports.

This is intentional. Scheduled cadence belongs to later R2C or an explicitly approved operations slice.

4. Zero-fill is conservative and limited.

It only runs when API rows are empty and totals are explicitly zero. It does not invent nonzero rows.

## Closure Decision

R2A closure status:

```text
Closed
```

Reason:

- importer exists;
- dry-run writes nothing;
- write import stores minimal aggregate rows;
- `analytics_source_sync_state` is truthful;
- idempotency is proven;
- canonical runtime acceptance passed;
- tests/build passed;
- no non-goals were pulled in;
- security boundaries held;
- internal telemetry remains operational source of truth.

## Recommended Next Step

Recommended next domain:

```text
R3A. Webmaster Host / Indexation / Query Visibility Dry Run
```

Alternative:

```text
R2B. Metrica traffic source/device/region/landing URL dimensions
```

Recommended order remains R3A first unless the team explicitly decides to deepen Metrica import before adding Webmaster external enrichment.

R4 should not start until at least one external source has accepted imported rows and source_sync_state, which R2A now provides.

## Final Git State At Closure

Before creating this detailed report, branch state was:

```text
branch = feat/r2a-metrica-import-foundation
head = a1cb76c
working tree = clean
```

This report is a docs-only follow-up artifact and does not change runtime behavior.
