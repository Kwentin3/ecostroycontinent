# R2B Metrica Traffic Source / Device / Region / Landing Implementation Report

Date: 2026-05-20  
Branch: `feat/r2b-metrica-traffic-dimensions`  
Implementation commit: `1cec46216e996ae27d2393b3a7fcc3e67ef0eae7`

## Executive Verdict

R2B is implemented locally as a bounded server-side Yandex Metrica aggregate enrichment importer. It extends the existing R2A importer and storage path, keeps internal first-party telemetry as operational truth, and adds no scheduled job, read-model integration, UI integration, recommendation logic, LLM integration or raw session import.

Canonical server acceptance is pending at report creation time because the local runtime has `YANDEX_METRICA_COUNTER_ID=109037342` but no `YANDEX_METRICA_OAUTH_TOKEN`. Local dry-run correctly exits as `not_configured` without writing data or leaking secrets.

## Files Changed

- `scripts/yandex/metrica-import-lib.mjs`
- `scripts/yandex/import-metrica-aggregates.mjs`
- `package.json`
- `db/migrations/012_external_metrica_r2b_dimensions.sql`
- `tests/yandex-metrica-import-r2b.test.js`

## Migration

Added `db/migrations/012_external_metrica_r2b_dimensions.sql`.

The migration preserves R2A rows and behavior, widens the allowed `report_type` set to include `traffic_source`, `source_detail`, `device`, `country`, `region` and `landing_url`, and adds nullable landing mapping fields:

- `normalized_url`
- `page_path`
- `entity_type`
- `entity_id`

Server application of this migration is pending canonical deploy/acceptance.

## Report Plan

Default period: last 3 fully completed Europe/Moscow days ending yesterday, unless explicit `--date1` and `--date2` are supplied.

Attribution model: `lastsign`.

Metrics: `ym:s:visits`, `ym:s:users`, `ym:s:pageviews`. Each report retries without `ym:s:users` if the Reporting API rejects that metric for the selected dimensions.

| Report type | Required | Dimensions |
| --- | --- | --- |
| `traffic_source` | yes | `ym:s:date`, `ym:s:lastsignTrafficSource` |
| `source_detail` | optional | `ym:s:date`, `ym:s:lastsignTrafficSource`, `ym:s:lastsignSourceEngine` |
| `device` | yes | `ym:s:date`, `ym:s:deviceCategory` |
| `country` | yes | `ym:s:date`, `ym:s:regionCountry` |
| `region` | optional | `ym:s:date`, `ym:s:regionCountry`, `ym:s:regionArea` |
| `landing_url` | yes | `ym:s:date`, `ym:s:startURLPath` |

The importer does not request city dimensions, dimensioned goals, raw sessions, Webvisor/clickmap data or a source-device-region-landing cross-product.

## Commands

Dry-run:

```bash
npm run yandex:metrica-import:r2b:dry-run -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD
```

Write import:

```bash
npm run yandex:metrica-import:r2b -- --date1=YYYY-MM-DD --date2=YYYY-MM-DD
```

Backward-compatible R2A default is preserved through `--mode=r2a`.

## Cardinality Controls

- Required API dry-run/probe before write.
- Default max rows per report: `5000`.
- Default max rows for landing report: `2000`.
- Default page limit: `5`.
- Bounded pagination uses `limit` and `offset`.
- Optional `source_detail` and `region` can safe-skip as `ok` with limitation.
- Required report skip/failure produces `partial` if another required report succeeded, or `failed` if no usable required report exists.
- Metadata stores safe API fields such as sample size, sample space, total rows, rounded total rows and data lag when available.

## Landing URL Normalization and Mapping

Landing rows normalize against `PUBLIC_SITE_URL`, with fallback `https://ecostroycontinent.ru`.

Normalization strips fragments and tracking parameters, normalizes trailing slash behavior, decodes percent-encoding safely, and stores `normalized_url` plus `page_path`.

Content Core route mapping is read-only. Unmapped landing paths are written to `analytics_unmapped_url_diagnostic` as diagnostics only. The importer does not create pages, redirects or sitemap entries.

## Dry-Run Result

Local command:

```bash
npm run yandex:metrica-import:r2b:dry-run -- --date1=2026-05-16 --date2=2026-05-16
```

Result: `not_configured`.

Reason: `YANDEX_METRICA_OAUTH_TOKEN is missing.` The command made no API write and no DB write. Output did not include tokens, Authorization headers or raw token-bearing objects.

Canonical server dry-run is pending.

## Import Result

Local write import was not attempted because the local runtime has no Metrica OAuth token. Mocked write-path tests prove aggregate persistence, source state updates, landing mapping and unmapped diagnostics.

Canonical server write import, SQL proof and idempotent rerun are pending.

## Source Sync State

Implemented for `analytics_source_sync_state` with `source_system = yandex_metrica`.

Status rules:

- `ok`: required reports completed or valid zero/empty results were recorded.
- `partial`: at least one required report succeeded and another required report failed or skipped unexpectedly.
- `failed`: no usable required API result/write exists.
- `not_configured`: missing counter id, missing token or disabled import.

Server proof is pending.

## Idempotency

R2B uses the existing aggregate upsert path keyed by source system, date, report type, dimension hash, metric key and goal id. Rerun idempotency is covered by mocked importer tests. Canonical server rerun proof is pending.

## Tests and Build

Targeted tests:

```bash
node --experimental-specifier-resolution=node --test tests/yandex-metrica-import-r2a.test.js tests/yandex-metrica-import-r2b.test.js tests/analytics-read-model.test.js tests/telemetry-no-direct-adapters.test.js
```

Result: passed, `34/34`.

Full tests:

```bash
npm test
```

Result: passed, `569/569`.

Build:

```bash
npm run build
```

Result: passed.

## Security Checks

- Server-side token only: `YANDEX_METRICA_OAUTH_TOKEN`.
- No browser-side Yandex API integration added.
- No read-model request path calls Yandex API.
- No imported rows are written to `analytics_event`.
- No raw sessions, user identifiers, IP addresses, user-agent history, form values, Authorization headers or OAuth tokens are stored.
- Safe error handling redacts sensitive keys from API error payloads.

## Official Documentation Checked

- Yandex Metrica Reporting API: https://yandex.com/dev/metrika/en/stat/
- `/stat/v1/data`: https://yandex.com/dev/metrika/en/stat/openapi/data
- Dimensions/metrics list: https://yandex.com/dev/metrika/en/stat/attrandmetr/dim_all
- Traffic source dimensions: https://yandex.com/dev/metrika/en/stat/attributes/visits/source
- Parametrization and attribution: https://yandex.com/dev/metrika/en/stat/param
- Sampling: https://yandex.com/dev/metrika/en/stat/sampling
- Quotas: https://yandex.com/dev/metrika/en/intro/quotas
- Errors: https://yandex.com/dev/metrika/en/intro/errors

## Server Deploy and Acceptance

Pending. Required next canonical checks:

1. Deploy branch through the existing build/deploy workflow.
2. Apply migration through `npm run db:migrate`.
3. Run R2B dry-run for a bounded completed period.
4. Run R2B write import.
5. Rerun write import for idempotency proof.
6. Prove rows by `report_type`, source sync state and unmapped diagnostics where applicable.
7. Prove no R2B rows exist in `analytics_event`.
8. Smoke internal telemetry and R4-lite source readiness.

## Known Limitations

- Local runtime cannot call Metrica Reporting API without `YANDEX_METRICA_OAUTH_TOKEN`.
- Actual server row counts, sampling, data lag and optional report safe-skip decisions must be recorded after canonical dry-run/write.
- `source_detail` and `region` are optional by design and can be skipped safely if cardinality is too high.
- R2B does not make Metrica data available in the read model; that remains full R4 scope.

## What Was Not Implemented

- No scheduled import cadence/R2C.
- No full R4 read model integration.
- No `/admin/visibility` changes.
- No recommendation lifecycle changes.
- No LLM integration.
- No lead/intake attribution.
- No raw sessions/logs/Webvisor/clickmap/ecommerce import.
- No arbitrary BI dimension explorer.

## Next Steps

1. Run canonical server dry-run and write import with the production server token.
2. Patch this report with server row counts, source state proof, idempotency proof and any sampling/data lag facts.
3. Proceed to full R4 only after R2B/R3B evidence is accepted.

## Git Status

At implementation commit `1cec46216e996ae27d2393b3a7fcc3e67ef0eae7`, code/test/migration changes were committed. Documentation updates are intentionally added after that commit.
