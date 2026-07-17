# Blueprint R2B. Metrica Traffic Source / Device / Region / Landing Import

Русское название: R2B. Импорт источников, устройств, регионов и лендингов из Яндекс Метрики.

Проект: Экостройконтинент
Домен: SEO Dashboard / Visibility / Analytics Foundation
Статус: draft for review; implementation not started
Дата: 2026-05-19

## 1. Current Architecture

R2A is implemented and accepted:

- server-side Metrica importer exists;
- dry-run and write-import commands exist;
- `external_metrica_daily_aggregate` stores minimal daily totals/goals;
- `analytics_source_sync_state` stores `yandex_metrica` state;
- same-period rerun is idempotent;
- all R2A accepted values for `2026-05-16..2026-05-18` were external zeros;
- read model does not treat Metrica as primary traffic/contact truth.

R4-lite is implemented and accepted:

- analytics read model exposes `external_source_readiness`;
- Metrica source state is visible as readiness/limited diagnostic;
- Metrica zeros are not pushed into primary overview or recommendations;
- no live Yandex API call occurs in read model request path.

Current table `external_metrica_daily_aggregate` is useful but currently constrained for R2A only:

- `report_type` check allows only `traffic_total` and `goal_reaches`;
- `metric_key` check allows `visits`, `pageviews`, `users`, `goal_reaches`;
- flexible `dimensions jsonb` exists;
- first-class `normalized_url`, `page_path`, `entity_type`, `entity_id` are absent.

Therefore R2B implementation will likely require a migration to widen report types and support landing URL mapping fields.

## 2. Official API Capability Check

Checked official Yandex Metrica docs on 2026-05-19:

- Reporting API introduction: https://yandex.com/dev/metrika/en/stat/
- Table endpoint `/stat/v1/data`: https://yandex.com/dev/metrika/en/stat/openapi/data
- Full dimensions and metrics list: https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all
- Traffic source dimensions: https://yandex.com/dev/metrika/en/stat/attributes/visits/source
- Geography preset/dimensions: https://yandex.com/dev/metrika/en/stat/presets/visitors/preset_geo
- Parametrization/attribution: https://yandex.com/dev/metrika/en/stat/param
- Object IDs examples for regions/source values: https://yandex.com/dev/metrika/en/stat/get-id

Confirmed endpoint:

- `GET https://api-metrika.yandex.net/stat/v1/data`
- JSON table response by default; CSV is also supported, but R2B should continue JSON importer style unless implementation proves a reason to change.

Confirmed common request parameters:

- `ids` / counter id;
- `metrics`;
- `dimensions`;
- `date1`, `date2`;
- `filters`;
- `sort`;
- `limit`, `offset`;
- `accuracy`;
- `lang`, `timezone`.

Confirmed response metadata relevant to R2B:

- `data` rows;
- `total_rows` and `total_rows_rounded`;
- `sampled`, `sample_share`, `sample_size`, `sample_space`;
- `contains_sensitive_data`;
- `data_lag`;
- `totals`.

Confirmed dimensions / metrics for the R2B plan:

| R2B need | Official dimension/metric candidate | Notes |
| --- | --- | --- |
| Date | `ym:s:date` | Already used in R2A. |
| Traffic source category | `ym:s:<attribution>TrafficSource` | Official traffic dimension. Use explicit `attribution=lastsign` by default unless product chooses differently. |
| Detailed source/search source | `ym:s:<attribution>SourceEngine` | Official second-level traffic source dimension; dry-run should verify values for current counter. |
| Device category | `ym:s:deviceCategory` | Listed in official dimensions. |
| Country | `ym:s:regionCountry` | Official geography preset lists country/area/city. Country-first recommended. |
| Region/area | `ym:s:regionArea` | Optional R2B deepening after country dry-run. |
| City | `ym:s:regionCity` | Not recommended for first R2B due cardinality. |
| Landing path | `ym:s:startURLPath` | Official landing page path dimension. Preferred first landing dimension. |
| Landing full path | `ym:s:startURLPathFull` | Includes query/fragment; only if needed and normalized aggressively. |
| Visits | `ym:s:visits` | Required. |
| Users | `ym:s:users` | Required if compatible with each selected report. If rejected, retry without users and mark unavailable/partial. |
| Pageviews | `ym:s:pageviews` | Required. |
| Goal reaches | `ym:s:goal<goalId>reaches` | Supported pattern already used by R2A; avoid multiplying across high-cardinality dimensions in first R2B. |

Important API constraints for implementation:

- Do not mix incompatible prefixes/sets in the same request; keep R2B reports in `ym:s:` session scope.
- Use pagination with `limit`/`offset` when `total_rows` exceeds one page.
- Treat `sampled=true`, low `sample_share`, `contains_sensitive_data=true`, `total_rows_rounded=true` and high `data_lag` as limitations in metadata/source state.
- Dry-run must verify all exact dimensions against the real counter before write mode.

## 3. Proposed Architecture

Target flow:

```text
Yandex Metrica Reporting API
-> server-side R2B importer
-> dry-run report plans
-> bounded completed date range
-> selected reports: traffic_source, device, country/region, landing_url
-> normalized dimension tuple
-> URL normalization and Content Core mapping for landing report
-> external_metrica_daily_aggregate or migration-expanded equivalent
-> analytics_unmapped_url_diagnostic for unmapped landing URLs
-> analytics_source_sync_state for yandex_metrica
-> later full R4 read model integration
```

No browser/client Metrica API calls. No live Yandex API call in read model. No scheduler in R2B unless separately approved as R2C.

Implementation should extend existing R2A importer patterns where practical:

- server-only token usage;
- safe summary formatting;
- redacted errors;
- dry-run write isolation;
- idempotent upserts;
- source sync state update.

## 4. Report Plan

R2B must not start with one huge cross-product report. Use multiple bounded reports.

### A. Traffic Source Report

Purpose: identify source categories and optionally detailed source engines.

Initial dimensions:

```text
ym:s:date,
ym:s:<attribution>TrafficSource
```

Optional second pass if dry-run row count is safe:

```text
ym:s:date,
ym:s:<attribution>TrafficSource,
ym:s:<attribution>SourceEngine
```

Metrics:

```text
ym:s:visits, ym:s:users, ym:s:pageviews
```

Recommended attribution default:

- `attribution=lastsign` because official docs list it as the last significant source and R2B needs practical acquisition summaries.
- Keep attribution model in report metadata.
- Product may later choose a different model; do not mix multiple models in the same R2B storage key without explicit `attribution_model` dimension.

### B. Device Report

Purpose: understand external traffic by device category.

Dimensions:

```text
ym:s:date,
ym:s:deviceCategory
```

Metrics:

```text
ym:s:visits, ym:s:users, ym:s:pageviews
```

### C. Country / Region Report

Purpose: understand geography without high cardinality.

First R2B dimensions:

```text
ym:s:date,
ym:s:regionCountry
```

Optional later R2B mode if country rows are safe:

```text
ym:s:date,
ym:s:regionCountry,
ym:s:regionArea
```

Not recommended for first R2B:

```text
ym:s:regionCity
```

Metrics:

```text
ym:s:visits, ym:s:users, ym:s:pageviews
```

### D. Landing URL Report

Purpose: identify external landing/start URLs and unmapped Content Core routes.

Preferred first dimensions:

```text
ym:s:date,
ym:s:startURLPath
```

Alternative if full path/query is required and dry-run is safe:

```text
ym:s:date,
ym:s:startURLPathFull
```

Metrics:

```text
ym:s:visits, ym:s:users, ym:s:pageviews
```

Goal reaches:

- default: do not include 11 goals in landing/source/device/region R2B reports;
- keep goal reaches in R2A daily goal reports;
- allow dimensioned goal reaches only after dry-run proves low row count and product explicitly wants the additional cut.

## 5. Storage Design

Target table direction remains `external_metrica_daily_aggregate`, but current R2A migration likely needs expansion before R2B write mode.

Recommended migration direction for implementation, not this document:

- widen `report_type` check to include:
  - `traffic_source`;
  - `source_detail` if separate from traffic source;
  - `device`;
  - `country`;
  - `region`;
  - `landing_url`.
- preserve existing `traffic_total` and `goal_reaches` values;
- keep `metric_key` at least `visits`, `pageviews`, `users`; keep `goal_reaches` for any approved dimensioned goal extension;
- add nullable first-class landing mapping fields if implementation needs efficient later R4:
  - `normalized_url`;
  - `page_path`;
  - `entity_type`;
  - `entity_id`.
- preserve `dimensions jsonb` for all normalized dimension tuples;
- preserve `metadata jsonb` for safe report metadata only.

Expected R2B row shape:

| Field | Example |
| --- | --- |
| `source_system` | `yandex_metrica` |
| `date` | `2026-05-18` |
| `period_grain` | `day` |
| `report_type` | `traffic_source`, `device`, `country`, `landing_url` |
| `dimension_hash` | hash of normalized dimensions |
| `dimensions` | `{ "traffic_source": "organic", "traffic_source_name": "Traffic from search engines", "attribution_model": "lastsign" }` |
| `metric_key` | `visits`, `users`, `pageviews` |
| `metric_value` | numeric aggregate |
| `goal_id` / `goal_name` | empty for non-goal rows |
| `normalized_url` | landing report only |
| `page_path` | mapped landing path when resolved |
| `metadata` | `{ "api_dimension": "ym:s:startURLPath", "sampled": false, "data_lag": 0 }` |

If implementation chooses not to add first-class URL fields, it must justify why `dimensions/metadata` are sufficient and how later R4 can query landing summaries without loading raw rows into DTO.

Do not store imported R2B rows in `analytics_event` or first-party telemetry tables.

## 6. Cardinality Controls

R2B must include hard guardrails:

- dry-run every report before write mode;
- default to a short completed date range;
- no today/yesterday default if Metrica lag makes data unreliable;
- max rows per report and max pages per report;
- pagination using `limit`/`offset`, with bounded max total rows;
- skip or mark `partial` for a report that exceeds configured cardinality;
- do not combine source + device + region + landing in one report;
- country before region; no city in first R2B;
- landing path before full landing URL with query params;
- metadata must record sampled/rounded/limited response states.

Suggested first implementation defaults to review:

- date range: last 3 fully completed Europe/Moscow days ending yesterday or an explicit `--date1/--date2`;
- per-report dry-run max rows: 5,000;
- landing report dry-run max rows: 2,000;
- first write import can skip region deepening if country rows already answer the product question.

## 7. Idempotency

Recommended upsert key remains compatible with R2A:

```text
source_system + date + report_type + dimension_hash + metric_key + goal_id
```

`dimension_hash` must be derived from normalized dimensions, not raw API row order. It should include:

- report type;
- attribution model where applicable;
- dimension IDs/names after normalization;
- normalized URL/path for landing report.

Rerunning the same source/date/report/dimension/metric must update `metric_value`, `imported_at`, `import_run_id` and safe metadata without creating duplicates.

## 8. URL Normalization / Mapping

For landing/start URL reports:

- normalize scheme and host to canonical production host;
- strip fragments;
- strip UTM and tracking query params;
- normalize trailing slash;
- normalize percent encoding safely;
- prefer `startURLPath` over full URL when sufficient;
- map to public Content Core route/entity where possible;
- write unmatched normalized URLs to `analytics_unmapped_url_diagnostic`;
- do not create Content Core pages;
- do not mutate sitemap;
- do not add redirects automatically.

Unmapped URLs are diagnostic signals only.

## 9. Source Sync State

R2B continues updating `analytics_source_sync_state` for:

```text
source_system = yandex_metrica
```

Fields:

- `status`;
- `last_attempted_at`;
- `last_successful_at`;
- `imported_period_start`;
- `imported_period_end`;
- `rows_imported`;
- `safe_error_message`;
- `unmapped_url_count`.

Status semantics:

- `not_configured`: counter id/token/importer env missing or disabled.
- `ok`: all selected required R2B reports completed within cardinality limits.
- `partial`: at least one selected required report succeeded and another failed/skipped unexpectedly.
- `failed`: no usable API result or no accepted write for the selected plan.
- `stale`: last success exists but imported period is older than freshness threshold.

If a report returns valid zero rows:

- do not fabricate rows;
- mark source state `ok` or `partial` according to whether the endpoint call itself succeeded and whether other selected reports succeeded;
- record limitation in metadata/report.

## 10. Error Handling

Map errors safely:

| Error | Required R2B behavior |
| --- | --- |
| Missing token/counter id | `not_configured`, no token output. |
| Token expired/invalid | `failed`, safe message, no raw auth dump. |
| Counter access denied/not found | `failed`, counter id only if needed. |
| Invalid dimension/metric | fail that report; `partial` if others succeeded. |
| Users metric incompatible | retry without `ym:s:users`, mark users unavailable for that report. |
| Quota/rate limit | bounded retry if safe; otherwise `partial`/`failed`. |
| Too many rows/high cardinality | skip report with `partial`, safe message and row estimate. |
| Sampling/rounded rows | import with limitation if acceptable, or partial if product threshold rejects it. |
| Delayed data/data lag | import available period and mark freshness honestly. |
| Network failure | `partial`/`failed`, no infinite retry. |

Do not dump raw request configs, Authorization headers, token-bearing objects or raw responses with sensitive context.

## 11. Security

R2B must preserve external aggregate-only boundaries:

- use only server-side `YANDEX_METRICA_OAUTH_TOKEN`;
- never expose OAuth tokens, refresh tokens, client secrets or Authorization headers;
- no browser/client Metrica API calls;
- no direct UI -> Metrica API;
- no raw sessions/logs;
- no Metrica user identifiers;
- no IP/raw user agent;
- no form values;
- no Webvisor/clickmap/session replay data;
- no read model request-path external API call.

## 12. Tests Required for Later Implementation

R2B implementation should add tests for:

- mocked API client;
- dry-run writes nothing;
- source report rows normalized;
- detailed source/search engine report rows normalized if implemented;
- device report rows normalized;
- country report rows normalized;
- region report rows normalized or safely skipped;
- landing URL rows normalized and mapped;
- unmapped diagnostics written;
- idempotent rerun;
- cardinality guard stops oversized report;
- `ym:s:users` rejection retries without users and marks limitation;
- one report failure produces `partial` when other reports succeeded;
- invalid dimension/metric safe error;
- rate-limit safe handling;
- no token leakage in summaries/errors;
- no UI/browser Metrica API added;
- no read model/full R4 integration added.

Run for implementation later:

- targeted R2B tests;
- `npm test`;
- `npm run build`.

## 13. Server Acceptance Plan for Later Implementation

1. Deploy through existing GHCR/GitHub Actions/canonical compose workflow.
2. Apply migration if R2B widens storage schema.
3. Run R2B dry-run on canonical runtime for bounded completed period.
4. Verify report plan, selected dimensions, row counts, sampling/data lag and cardinality state.
5. Run bounded R2B write import.
6. Prove rows exist by `report_type`.
7. Prove `analytics_source_sync_state` for `yandex_metrica` is truthful.
8. Rerun same period and prove idempotency.
9. Prove unmapped diagnostics for landing URLs where applicable.
10. Prove no read model/UI integration was added.
11. Prove no secrets in output.
12. Prove internal telemetry still works.

## 14. Rollback

R2B should be operator-triggered and unscheduled.

Rollback options:

- stop running R2B command;
- delete imported rows by bounded `source_system/date/report_type` partition if bad data was imported;
- correct `analytics_source_sync_state` if needed;
- keep R2A rows intact unless rollback explicitly targets the same partition;
- no Content Core rollback because R2B must not mutate Content Core;
- no read model rollback because R2B must not wire full R4.

## 15. Non-goals Reminder

R2B must not implement:

- full BI warehouse;
- arbitrary dimension explorer;
- scheduled cadence/R2C;
- full R4 read model integration;
- `/admin/visibility` redesign;
- recommendations;
- LLM;
- lead/intake;
- raw sessions/logs;
- Webvisor/clickmap/session replay;
- user-level attribution;
- Content Core mutation;
- direct browser/UI Metrica API.

## 16. References

- PRD R2B: `docs/product-ux/PRD_R2B_Metrica_Traffic_Source_Device_Region_Landing_Import_Экостройконтинент_v0.1.md`
- PRD R2: `docs/product-ux/PRD_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- Blueprint R2: `docs/blueprints/BLUEPRINT_R2_Metrica_Import_Foundation_Экостройконтинент_v0.1.md`
- Storage Addendum: `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- R2A report: `docs/reports/2026-05-19/R2A_METRICA_IMPORT_FOUNDATION_DOMAIN_CLOSURE_DETAILED_REPORT_Экостройконтинент_v0.1.report.md`
- R4-lite implementation report: `docs/reports/2026-05-19/R4_LITE_EXTERNAL_SOURCE_READINESS_IMPLEMENTATION_Экостройконтинент_v0.1.report.md`
- Official Yandex Metrica Reporting API introduction: https://yandex.com/dev/metrika/en/stat/
- Official table endpoint: https://yandex.com/dev/metrika/en/stat/openapi/data
- Official dimensions/metrics list: https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all
- Official traffic dimensions: https://yandex.com/dev/metrika/en/stat/attributes/visits/source
- Official geography preset: https://yandex.com/dev/metrika/en/stat/presets/visitors/preset_geo
- Official parametrization: https://yandex.com/dev/metrika/en/stat/param
- Official object IDs examples: https://yandex.com/dev/metrika/en/stat/get-id