# Addendum R2/R3. External Imports Storage Direction

Проект: Экостройконтинент.
Домен: SEO Dashboard / Visibility / Analytics Foundation.
Статус: storage direction for future implementation; no migration in this document.
Дата: 2026-05-19.

## 1. Purpose

This addendum fixes storage direction for R2/R3 external imports before implementation planning.

It does not create a migration and does not change runtime. Its purpose is to prevent R2/R3 from becoming a large BI/import combiner and to keep first implementation slices small, idempotent and auditable.

## 2. Why Current Tables Are Not Enough

### `analytics_page_daily`

`analytics_page_daily` is not enough for general Yandex Metrica external aggregates because it lacks:

- `source_system`;
- external report identity;
- `goal_id` / `goal_name`;
- region/country dimensions;
- device/source dimensions as flexible external report dimensions;
- `imported_at`;
- `importer_version`;
- `import_run_id`;
- flexible dimension tuple.

It can remain useful for internal/business aggregates, but imported Metrica report rows should not be forced into it unless a future implementation proves a narrow compatible use case.

### `external_search_visibility_daily`

`external_search_visibility_daily` fits genuine query/page/date search visibility rows, especially for Webmaster query analytics.

It does not fit:

- Webmaster host snapshots;
- indexation summaries;
- URL samples;
- important URL monitoring snapshots;
- appeared/removed search event samples;
- endpoint capability dry-run results.

Do not store non-visibility Webmaster records in `external_search_visibility_daily` just to avoid a migration.

## 3. Recommended Logical Entities

### R2 Metrica

Recommended future table direction:

- `external_metrica_daily_aggregate`; or
- a generalized `external_traffic_daily_aggregate` if the team wants one table for future analytics providers.

Minimal logical fields:

| Field | Purpose |
| --- | --- |
| `id` | Primary key. |
| `source_system` | `yandex_metrica`. |
| `date` | Aggregate date. |
| `period_grain` | Initially `day`; later `week`/`month` if approved. |
| `report_type` | Example: `traffic_total`, `goal_reaches`, later `source`, `device`, `region`, `landing_url`. |
| `dimension_hash` | Stable hash of normalized dimension tuple. |
| `dimensions` | Safe JSON object with selected dimensions. |
| `metric_key` | Example: `visits`, `pageviews`, `users`, `goal_reaches`. |
| `metric_value` | Numeric aggregate value. |
| `goal_id` | Nullable external goal id. |
| `goal_name` | Nullable project/Yandex goal name. |
| `page_path` | Nullable normalized project path. |
| `normalized_url` | Nullable normalized external URL. |
| `imported_at` | Import timestamp. |
| `import_run_id` | Optional run/audit id. |
| `metadata` | Safe JSON only; no secrets or raw auth/request dumps. |

R2A should start with minimal report types:

- `traffic_total`;
- `goal_reaches`.

High-cardinality dimensions should wait for later R2B/R2C slices.

### R3 Webmaster

Recommended future table direction:

- `external_webmaster_host_snapshot`;
- `external_webmaster_indexation_snapshot`;
- `external_webmaster_url_sample`;
- `external_webmaster_query_visibility_daily`.

`external_search_visibility_daily` may be reused for `external_webmaster_query_visibility_daily` if the existing shape is sufficient for genuine query/page/date rows. If host/indexation/sample data is needed, use a separate table or migration.

Minimal fields for query visibility:

| Field | Purpose |
| --- | --- |
| `source_system` | `yandex_webmaster`. |
| `date` | Aggregate date. |
| `query` | Aggregate query text or normalized key. |
| `page_path` / `normalized_url` | Mapped page path or normalized external URL. |
| `device` | Device dimension if available. |
| `region` / `country` | Optional if API returns geography. |
| `impressions` | Search shows/impressions. |
| `clicks` | Search clicks. |
| `ctr` | Imported or computed. |
| `average_position` | Average show/click position where available. |
| `import_run_id` | Optional run/audit id. |
| `metadata` | Safe endpoint/report metadata only. |

Minimal fields for host/indexation/sample tables should include:

- `source_system`;
- endpoint/report type;
- normalized URL where applicable;
- observed/import period;
- imported timestamp;
- safe status/indicator fields from API;
- safe metadata.

## 4. Upsert / Idempotency Keys

R2 aggregate key:

```text
source_system + date + report_type + dimension_hash + metric_key + goal_id
```

R3 query visibility key:

```text
source_system + date + query + page_path/normalized_url + device + region/country
```

R3 snapshot/sample key:

```text
source_system + endpoint + normalized_url + observed_at/import_period
```

If a future implementation uses an import run table, `import_run_id` should support auditability but should not be part of the dedupe key for aggregate facts.

## 5. Shared Existing Tables

Use existing shared state/diagnostic tables:

- `analytics_source_sync_state` already exists and should record source attempts, success, failures, freshness, row counts and safe errors.
- `analytics_unmapped_url_diagnostic` already exists and should record unmatched URLs where URL imports run.

Optional future entity:

- `external_import_run` or equivalent, only if implementation needs run-level audit across multiple reports/endpoints.

## 6. What Not To Store

Do not store:

- raw sessions;
- raw visits/log rows;
- tokens;
- refresh tokens;
- client secrets;
- raw Authorization headers;
- raw request dumps;
- raw response dumps that include sensitive headers/request context;
- form values;
- user-level identifiers;
- IP;
- raw user agent;
- Webvisor/clickmap/session replay data.

## 7. Migration Note

R2A/R3A likely require a migration if they write imported aggregate/snapshot rows to project storage.

That migration belongs to the future implementation task, not this documentation refinement. Before writing the migration, the implementation agent must:

1. run a safe API dry-run;
2. confirm selected report/endpoint shapes;
3. choose the minimal table shape needed for R2A or R3A;
4. keep read model integration out of scope until R4 unless explicitly approved as source-state-only.
