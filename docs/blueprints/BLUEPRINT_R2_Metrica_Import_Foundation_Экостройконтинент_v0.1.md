# Blueprint R2. Metrica Import Foundation

Русское название: Импорт агрегатов Яндекс Метрики.
Проект: Экостройконтинент.
Статус: draft for review; implementation not started.
Дата: 2026-05-19.

## 1. Current Architecture

R1 status:

- public actions continue through `/api/telemetry/events`;
- internal telemetry is operational source of truth;
- public Yandex Metrica counter is enabled as optional external mirror;
- conservative counter options are active: `webvisor=false`, `clickmap=false`, `ecommerce=false`, `trackLinks=false`, `accurateTrackBounce=false`;
- approved `phone_clicked` action mirrors to `click_to_call` at browser/network level;
- external Metrica Reporting API visibility for the smoke goal was delayed/pending in the final R1 report.

Current storage/read side:

- `telemetry_events` and `telemetry_contact_journeys` hold first-party operational telemetry.
- `analytics_source_sync_state` exists and already supports source status/freshness fields.
- `analytics_unmapped_url_diagnostic` exists for URL mapping diagnostics.
- `analytics_page_daily` exists for project analytics aggregates, but it does not carry `source_system`, region, goal id/name or import metadata.
- Analytics read model currently remains a consumer DTO boundary and must not query Yandex directly.

## 2. Official API Capability Check

Checked official docs on 2026-05-19:

- Yandex Metrica Reporting API / stat API: `https://yandex.com/dev/metrika/stat/index`
- Dimensions and metrics list: `https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all`
- Traffic dimensions: `https://yandex.com/dev/metrika/en/stat/attributes/visits/source`
- Quotas: `https://yandex.ru/dev/metrika/en/intro/quotas`

Confirmed capabilities:

- Reporting API supports report requests with `ids`, `metrics`, `dimensions`, `date1`, `date2`, `filters`, `sort`, `accuracy`, `limit`, `offset`, `group`, `currency`, `lang` and `timezone`.
- Core metrics include visits, users and pageviews for standard reports.
- Official examples and dimension lists confirm date, region/country, traffic source, search engine, page URL/path/start URL and device-category style dimensions.
- Goal reaches can be queried as goal metrics; current project smoke tooling already used the `ym:s:goal<goalId>reaches` pattern.
- API supports table, drilldown and by-time report shapes.
- API has quota/rate-limit constraints and can return delayed statistics.

Must be verified during implementation:

- exact dimension names for the chosen source attribution model, device category, landing/start URL and region slices;
- exact goal metric list for all 11 project goals by current goal IDs;
- whether conversion rate should be imported from API or computed later from imported reaches/visits;
- the safest report granularity that avoids high-cardinality row explosion.

Unavailable or out of R2:

- raw sessions and raw hit logs are not part of this domain;
- Webvisor, clickmap and session replay data are not imported;
- Metrica does not provide Content Core entity/revision identity, so it cannot be used as canonical route ownership.

## 3. Proposed Import Architecture

Recommended architecture:

```text
Yandex Metrica Reporting API
-> server-side importer/job
-> report plan for approved dimensions/metrics
-> normalized aggregate rows
-> project storage
-> analytics_source_sync_state
-> R4 read model integration later
```

Implementation should start with an operator-triggered or manually invocable importer and only then enable a scheduled cadence if approved. The importer should be idempotent and safe to rerun over the same period.

No UI component and no public browser code should call Metrica API.

## 3.1 R2A Minimal First Slice

Recommended first implementation slice:

```text
R2A. Metrica Import Dry Run + Source Sync State + Minimal Daily Traffic/Goals
```

R2A goal:

- prove API access, report shape, project storage, source state, idempotency and safe errors with a minimal aggregate set.

R2A flow:

```text
server command/job
-> validate server env without printing token
-> dry-run real counter/report plan without writes
-> choose bounded completed date range
-> write minimal aggregate rows
-> update analytics_source_sync_state
-> rerun same range to prove idempotency
-> report rows/status/errors safely
```

R2A minimal report set:

- visits total by date;
- pageviews total by date;
- users by date if the selected API report reliably supports it;
- goal reaches by date for the 11 configured goals;
- no traffic source/device/region/landing URL dimensions in the first write path.

R2A required storage/state:

- `analytics_source_sync_state` row for `source_system = yandex_metrica`;
- imported period start/end;
- rows imported;
- safe error message;
- aggregate rows in a future external aggregate table or equivalent implementation table.

R2A non-goals:

- no high-cardinality dimensions;
- no landing/start URL import;
- no traffic source/search engine/device/region reports;
- no conversion-rate layer;
- no reconciliation with internal telemetry;
- no scheduler-first default;
- no read model wiring;
- no UI changes.

Operator-triggered import is preferred for R2A. Scheduled cadence should wait for R2C or explicit owner approval after R2A acceptance.

Migration is likely needed for R2A if aggregate rows are stored. See `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`.

## 3.2 R2 Later Slices

- R2B: add traffic sources, search engines, devices, regions and landing/start URLs after R2A proves the foundation.
- R2C: add scheduled cadence, retention and stale threshold tuning.
- R2D: add reconciliation with internal telemetry if the team needs discrepancy reporting.

Recommended order inside R2:

```text
R2A -> R2B -> R2C -> R2D
```

Do not collapse all R2 sub-slices into the first implementation.

## 4. Storage Design

Existing tables:

- `analytics_source_sync_state`: use for `source_system = yandex_metrica`.
- `analytics_unmapped_url_diagnostic`: use for landing URL mapping failures.
- `analytics_page_daily`: may be usable only for a narrow page/day aggregate if implementation decides that its key shape matches a specific report.

Storage gap:

`analytics_page_daily` is not enough for general external Metrica imports because it lacks:

- explicit `source_system`;
- region/country dimensions;
- goal id/name;
- external report identity;
- importer version or source metric key;
- flexible dimension sets.

Recommended schema direction for implementation:

- either add dedicated external Metrica aggregate tables;
- or add a generalized external traffic aggregate table.

Detailed shared direction is recorded in `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`.

Suggested logical columns:

| Column | Purpose |
| --- | --- |
| `source_system` | `yandex_metrica`. |
| `date` | Aggregate date. |
| `period_grain` | Day initially; week/month later if needed. |
| `page_path` / `landing_url` | Normalized path or raw landing URL where applicable. |
| `source` / `medium` / `traffic_source` | External source slice. |
| `search_engine` | Search engine where applicable. |
| `device` | Device category. |
| `country` / `region` | Geography slice. |
| `goal_id` / `goal_name` | Goal aggregate identity where applicable. |
| `visits` | Aggregate visits. |
| `users` | Aggregate users if available. |
| `pageviews` | Aggregate pageviews. |
| `goal_reaches` | Goal reaches. |
| `conversion_rate` | Imported or computed later. |
| `metadata` | Safe source report metadata only. |
| `imported_at` | Import timestamp. |

Implementation may require a migration. This blueprint does not create it.

Do not write imported aggregate rows into `analytics_event`; imported Metrica rows are not first-party raw events.

## 5. Idempotency

Importer must be safe to rerun:

- import by explicit date range;
- upsert by source system, date, report grain, dimension tuple and metric/goal key;
- delete-and-replace only inside a bounded date/report partition if upsert is not practical;
- never append duplicates for the same period;
- store rows imported count per attempt.

Recommended keys:

- traffic aggregate: `source_system + date + page_path/landing_url + source + search_engine + device + country/region`;
- goal aggregate: `source_system + date + goal_id/goal_name + page_path/landing_url + source + device + country/region`, depending on selected report.

## 6. Sync State

Use `analytics_source_sync_state` with:

- `source_system = yandex_metrica`;
- `status`;
- `last_attempted_at`;
- `last_successful_at`;
- `imported_period_start`;
- `imported_period_end`;
- `rows_imported`;
- `safe_error_message`;
- `unmapped_url_count`, if landing URL mapping runs.

Status rules:

- `not_configured`: missing counter id, missing server token or disabled importer.
- `ok`: all required report slices imported and freshness threshold is satisfied.
- `partial`: at least one required slice succeeded and at least one required slice failed.
- `failed`: no usable new data was imported in the last attempt.
- `stale`: last success exists, but latest imported period is older than freshness threshold.

## 7. Error Handling

Map errors to safe categories:

| Error | Required behavior |
| --- | --- |
| Token expired/invalid | `failed`, safe message, no token output. |
| No counter access | `failed` or `not_configured` depending on env validity. |
| Counter not found | `failed`, safe message with counter id only. |
| Invalid dimension/metric | `failed` for that slice; `partial` if other slices succeeded. |
| Rate limit/quota | retry with bounded backoff only if safe; otherwise `partial`/`failed`. |
| Delayed data | import available period, mark freshness honestly. |
| Network failure | `failed` or `partial`; no infinite retry loop. |

All logs/reports must mask secrets and avoid raw response dumps if they may contain tokens or sensitive request headers.

## 8. URL / Entity Mapping

For landing URLs or start URLs:

- normalize host and scheme against canonical domain;
- strip tracking query parameters before matching;
- normalize trailing slash and percent encoding consistently;
- resolve known public routes through existing public content/read-side helpers where possible;
- write unmapped URLs to `analytics_unmapped_url_diagnostic`;
- never silently drop unmapped URLs.

Imported URL mapping is a best-effort enrichment. Content Core remains the source of truth for page/entity/revision ownership.

## 9. Security

Rules:

- use only server-side `YANDEX_METRICA_OAUTH_TOKEN`;
- never expose token, refresh token or client secret to browser/read model/report;
- no UI -> Yandex API;
- no raw sessions, IPs, user agents, form values or Metrica user identifiers;
- aggregate-only storage;
- safe error messages only.

## 10. Tests

Required tests for implementation:

- API client is mocked for unit/integration tests.
- Missing env -> `not_configured`.
- Successful import writes aggregate rows and `ok` source state.
- Rerun same range is idempotent.
- Partial report failure writes `partial` state.
- Invalid dimension maps to safe error without raw secret-bearing request output.
- Rate-limit response is handled without infinite retry.
- Landing URL mapping writes unmapped diagnostics.
- No direct UI/browser Metrica API calls.
- No imported Metrica data is treated as internal telemetry truth.
- Secrets are absent from generated reports/DTOs.

## 11. Server Acceptance Plan

Later implementation should prove:

1. Env is present on canonical runtime without printing token values.
2. Importer dry-run resolves counter and selected report plan.
3. Limited period import runs, preferably one recent completed day.
4. DB contains expected aggregate rows.
5. `analytics_source_sync_state` row for `yandex_metrica` is truthful.
6. Unmapped URL diagnostics are populated when needed.
7. Read model is not changed unless R4 is explicitly in scope.
8. Internal telemetry still works independently.

## 12. Rollback

Rollback is operationally simple:

- disable scheduled job or remove operator trigger;
- leave internal telemetry untouched;
- imported rows can be recomputed or deleted by bounded source/date partition if implementation provides an admin-safe cleanup;
- no DB rollback should be needed unless schema migration is defective;
- no secret rotation is needed unless a secret was exposed.

## 13. Open Questions / Decisions

- First implementation mode: manual command, admin-only job, or scheduler?
- Import cadence and freshness threshold.
- New dedicated tables vs extension of existing aggregate tables.
- Exact date range for first import given Metrica processing delay.
- Exact dimension set to avoid excessive cardinality.
- Whether goal conversion rate is imported or computed in R4.
- Whether R2 should wait for delayed R1 goal visibility recheck before first production import.
- Exact R2A table shape/migration after API dry-run confirms report rows.

## 14. Architecture Decision Summary

Recommended design:

- server-side, aggregate-only importer;
- project storage owns imported aggregate snapshots;
- `analytics_source_sync_state` is the source freshness contract;
- read model integration waits for R4;
- internal telemetry remains operational truth.

Rejected designs:

- UI calling Metrica API directly;
- importing raw logs/sessions as R2;
- using Metrica as the canonical record of public user actions;
- storing imported Metrica rows in `analytics_event`.
