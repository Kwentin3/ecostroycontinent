# R2B Metrica Traffic Source / Device / Region / Landing Implementation Report

Date: 2026-05-20  
Branch: `feat/r2b-metrica-traffic-dimensions`  
Implementation commit: `1cec46216e996ae27d2393b3a7fcc3e67ef0eae7`
Deployed runtime commit: `d008b4bb5dc3ebf9d075b83194fba422f42181f3`

## Executive Verdict

R2B is implemented and accepted on the canonical Selectel runtime as a bounded server-side Yandex Metrica aggregate enrichment importer. It extends the existing R2A importer and storage path, keeps internal first-party telemetry as operational truth, and adds no scheduled job, read-model integration, UI integration, recommendation logic, LLM integration or raw session import.

Accepted period: `2026-05-17..2026-05-19`. Canonical dry-run and write import both completed with status `ok`. The accepted write imported `30` aggregate metric rows across source, source detail, device, country, region and landing reports; `analytics_source_sync_state` for `yandex_metrica` is `ok`; same-period rerun stayed idempotent.

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

The migration was applied on the canonical SQL target through the existing `deploy-phase1` workflow path, which runs `npm run db:migrate`. Server schema proof confirmed the landing mapping columns exist.

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

Canonical runtime command:

```bash
docker exec repo-app-1 npm run yandex:metrica-import:r2b:dry-run -- --date1=2026-05-17 --date2=2026-05-19
```

Canonical dry-run result:

- status: `ok`
- rows prepared: `30`
- rows imported: `0`
- required reports `traffic_source`, `device`, `country`, `landing_url`: `ok`
- optional reports `source_detail`, `region`: `ok`
- unavailable metrics: none
- limitations: none
- sampling: `sampled=false`, `sample_share=1`
- data lag: `0`
- total metrics for each selected report: `4` visits, `4` users, `4` pageviews

## Import Result

Canonical runtime command:

```bash
docker exec repo-app-1 npm run yandex:metrica-import:r2b -- --date1=2026-05-17 --date2=2026-05-19
```

Canonical write result:

- status: `ok`
- rows prepared: `30`
- rows imported: `30`
- unmapped URL count: `0`
- source sync state written: `true`
- safe error message: empty
- errors: none

Rows by report type after write and idempotent rerun:

| report_type | rows | min_date | max_date | metric_sum |
| --- | ---: | --- | --- | ---: |
| `traffic_source` | 3 | 2026-05-19 | 2026-05-19 | 12 |
| `source_detail` | 3 | 2026-05-19 | 2026-05-19 | 12 |
| `device` | 6 | 2026-05-19 | 2026-05-19 | 12 |
| `country` | 6 | 2026-05-19 | 2026-05-19 | 12 |
| `region` | 6 | 2026-05-19 | 2026-05-19 | 12 |
| `landing_url` | 6 | 2026-05-19 | 2026-05-19 | 12 |

Each report contains the accepted metric keys `visits`, `users` and `pageviews`.

## Source Sync State

Implemented for `analytics_source_sync_state` with `source_system = yandex_metrica`.

Status rules:

- `ok`: required reports completed or valid zero/empty results were recorded.
- `partial`: at least one required report succeeded and another required report failed or skipped unexpectedly.
- `failed`: no usable required API result/write exists.
- `not_configured`: missing counter id, missing token or disabled import.

Canonical source state proof:

```text
source_system|status|imported_period_start|imported_period_end|rows_imported|unmapped_url_count|safe_error_message
yandex_metrica|ok|2026-05-17|2026-05-19|30|0|
```

## Idempotency

R2B uses the existing aggregate upsert path keyed by source system, date, report type, dimension hash, metric key and goal id. Same-period canonical rerun completed with status `ok` and the SQL row count remained `30` R2B rows for the accepted period and report set.

Landing rows after rerun:

| page_path | normalized_url | entity_type | rows | metric_sum |
| --- | --- | --- | ---: | ---: |
| `/` | `https://ecostroycontinent.ru/` | `page` | 3 | 3 |
| `/contacts` | `https://ecostroycontinent.ru/contacts` | `page` | 3 | 9 |

Open unmapped diagnostics for `yandex_metrica`: `0`.

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

Accepted.

- Build workflow: `build-and-publish`, run `26145890987`, success.
- Build URL: `https://github.com/Kwentin3/ecostroycontinent/actions/runs/26145890987`
- Published image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:a015c93dba5ab59a079f0d69a33c15c41f5d6c23000997de321e2dd87b59a602`
- Deploy workflow: `deploy-phase1`, run `26145991372`, success.
- Deploy URL: `https://github.com/Kwentin3/ecostroycontinent/actions/runs/26145991372`
- Runtime readiness commit: `d008b4bb5dc3ebf9d075b83194fba422f42181f3`
- Runtime readiness status: `ready`, database `ok`.

Additional acceptance proof:

- `external_metrica_daily_aggregate` contains `30` R2B rows for accepted reports and period.
- `analytics_source_sync_state` for `yandex_metrica` is `ok`.
- `analytics_unmapped_url_diagnostic` has `0` open `yandex_metrica` diagnostics after accepted landing import.
- `analytics_event` contains `0` R2B-import-shaped rows.
- Internal telemetry smoke passed: `POST /api/telemetry/events` returned `202` with `{"ok":true,"stored":true,"event_name":"page_viewed","journey_created":false}`.
- R4-lite read-model source readiness still builds: Metrica and Webmaster readiness are `ok/fresh`; no full R4 semantics were introduced.
- `npm run smoke:launch` against `https://ecostroycontinent.ru` passed: `28` passed, `0` failed, `1` optional media check skipped.

## Known Limitations

- Local runtime cannot call Metrica Reporting API without `YANDEX_METRICA_OAUTH_TOKEN`; canonical runtime has the token and was used for acceptance.
- The accepted Metrica period produced only `4` visits/users/pageviews, all on `2026-05-19`; this is low-volume external evidence, not operational traffic truth.
- `source_detail` and `region` are optional by design and happened to be safe for the accepted period.
- R2B stores imported aggregates, but does not integrate them into full read-model evidence; full R4 remains separate scope.
- R4-lite still exposes source readiness only. Its older limitation labels are not a full R2B evidence model and should not be treated as full R4.

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

1. Proceed to full R4 only if R2B/R3B evidence is considered sufficient for read-model consumption.
2. Consider R2C scheduler only after operator-triggered R2B acceptance remains stable.
3. Keep R5 recommendation refinement gated on richer accepted evidence and sample-size checks.

## Git Status

The final acceptance evidence is recorded in a closing docs commit after the server checks. No runtime secrets were committed.
