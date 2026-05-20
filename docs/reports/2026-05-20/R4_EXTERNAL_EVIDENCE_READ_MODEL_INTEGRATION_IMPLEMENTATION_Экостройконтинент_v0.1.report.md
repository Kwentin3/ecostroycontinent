# R4 External Evidence Read Model Integration Implementation Report

Дата: 2026-05-20
Проект: Экостройконтинент
Ветка: `feat/r4-external-evidence-read-model`
Runtime / implementation commit: `e3f9749f409258f8ebbfdd7b8de2101e07ede9d3`

## Executive Verdict

R4 implemented and accepted in bounded scope.

The analytics read model now exposes `external_evidence` for accepted Yandex Metrica R2B and Yandex Webmaster R3A/R3B storage rows. `external_source_readiness` remains intact. Metrica/Webmaster data is labelled as external evidence/enrichment, does not overwrite primary overview metrics, does not generate recommendations, and is not fetched from Yandex APIs in the read model request path.

## Files Changed

- `lib/analytics/repository.js`
- `lib/analytics/read-model.js`
- `components/admin/SeoVisibilityDashboard.js`
- `tests/analytics-read-model.test.js`
- `tests/admin-visibility-ui.test.js`
- `docs/blueprints/ADDENDUM_R4_External_Evidence_Read_Model_Integration_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`

No migration was needed for R4. R4 reads existing R2B/R3A/R3B project-owned tables.

## DTO Shape

Added root block:

- `external_evidence.yandex_metrica`
  - status/freshness/actionability/limitations
  - traffic sources
  - source details
  - devices
  - geography countries/regions
  - landing rows with read-only route/entity mapping
- `external_evidence.yandex_webmaster`
  - status/freshness/actionability/limitations
  - host/indexation summary
  - URL samples
  - query visibility rows/zero-row limitation

Rows are compact top-N summaries. Raw responses, metadata dumps, tokens, Authorization headers, sessions, IPs, user agents and form values are not exposed.

## Repository Helpers

Added compact read-only helpers:

- `getMetricaTrafficSourceEvidence`
- `getMetricaSourceDetailEvidence`
- `getMetricaDeviceEvidence`
- `getMetricaGeographyEvidence`
- `getMetricaLandingEvidence`
- `getWebmasterUrlSampleEvidence`
- `getWebmasterQueryVisibilityEvidence`

These helpers query project storage only. They do not call Yandex APIs.

## Metrica Evidence Result

Canonical SQL proof after deploy:

| report_type | rows | metric_sum |
| --- | ---: | ---: |
| `country` | 6 | 12 |
| `device` | 6 | 12 |
| `landing_url` | 6 | 12 |
| `region` | 6 | 12 |
| `source_detail` | 3 | 12 |
| `traffic_source` | 3 | 12 |

Read model acceptance summary:

- status: `ok`
- freshness: `fresh`
- period: `2026-05-17..2026-05-19`
- traffic source rows: `1`
- source detail rows: `1`
- device rows: `2`
- country rows: `2`
- region rows: `2`
- landing rows: `2`
- landing paths represented: `/contacts`, `/`
- mapped landing count: `2`
- unmapped landing count: `0`
- limitations: `external_metrica_not_operational_truth`, `metrica_external_enrichment_only`, `do_not_feed_metrica_into_primary_overview`, `low_external_sample_size`

## Webmaster Evidence Result

Canonical SQL proof:

- `analytics_source_sync_state.yandex_webmaster`: `ok`, period `2026-05-04..2026-05-17`, rows_imported `0`
- `external_webmaster_url_sample`: `1` row, `1` resolved
- `external_webmaster_query_visibility_daily`: `0` rows

Read model acceptance summary:

- status: `ok`
- freshness: `fresh`
- host verified: `true`
- host data status: `OK`
- searchable pages count: `1`
- URL sample count: `1`
- URL sample rows in DTO: `1`
- query visibility row count: `0`
- query limitations: `webmaster_query_visibility_no_rows_for_period`, `no_zero_demand_claim`

## Guardrails Verified

- Primary overview visits remained first-party/internal: server read model showed `overview.visits.value = 7` with first-party explanation.
- No recommendations were generated from Metrica/Webmaster evidence. Server recommendation issue types were existing Content Core/readiness issues only: `weak_proof_path`, `published_service_no_case`, `published_service_no_media`.
- No external limitation terms appeared in recommendations.
- No live Yandex API call patterns were present in deployed `lib/analytics/read-model.js` and `lib/analytics/repository.js`.
- `analytics_event` imported external rows count: `0`.
- Read model forbidden key scan returned `unsafe_key_count = 0`.

## UI Behavior

`/admin/visibility` now renders a compact External evidence block from read model DTO only:

- Metrica source/device/geo/landing summaries.
- Webmaster search state, URL sample and query evidence count.
- Source-specific limitations remain visible.

No UI redesign, filters, BI cube, charts or direct Yandex API calls were added.

## Tests And Build

Local:

- `node --experimental-specifier-resolution=node --test tests/analytics-read-model.test.js tests/admin-visibility-ui.test.js tests/yandex-metrica-import-r2b.test.js tests/yandex-webmaster-query-import-r3b.test.js tests/telemetry-no-direct-adapters.test.js` -> 35/35 pass.
- `npm test` -> 570/570 pass.
- `npm run build` -> pass.

Deployment:

- GHCR build workflow: `26147807025`, success.
- Image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:1b2a18855010116563d3336feff129c66c1652267103fddd98ac3da80b01e03a`.
- Deploy workflow: `26147916629`, success.
- Runtime readiness: commit `e3f9749f409258f8ebbfdd7b8de2101e07ede9d3`, DB `ok`.

## Server Acceptance

Accepted on canonical runtime:

- Authorized `/api/admin/visibility/read-model?period=28` returned `ok: true`.
- `external_source_readiness` exists.
- `external_evidence` exists.
- Metrica source/device/country/region/landing evidence is represented compactly.
- Landing mappings include `/` and `/contacts`.
- Webmaster host/indexation and URL sample evidence are present.
- Webmaster query visibility is a zero-row limitation, not zero demand.
- `/admin/visibility?period=28` returned HTTP `200`.
- `/api/telemetry/events` smoke with test `page_viewed` returned HTTP `202`.
- Temporary acceptance user/session was deleted.

## Security Checks

- No OAuth token, refresh token, client secret or Authorization header is exposed.
- No raw external API response is exposed.
- No raw sessions/logs/user identifiers/IP/user agent/form values are exposed in `external_evidence`.
- R4 does not store imported external rows in `analytics_event`.
- R4 does not call Yandex APIs from read model or UI request path.

## Known Limitations

- Metrica R2B accepted data is low-volume; DTO emits `low_external_sample_size`.
- Webmaster R3B accepted period has zero query visibility rows; DTO emits `webmaster_query_visibility_no_rows_for_period` and `no_zero_demand_claim`.
- R4 does not produce R5 recommendation rules.
- R4 does not add scheduled imports.
- R4 does not create pages, redirects, sitemap entries, leads or Content Core mutations.

## Not Implemented

- R2C/R3C scheduler or deeper export lifecycle.
- R5 recommendation refinement.
- LLM/copilot.
- Lead/intake attribution.
- BI/query builder or arbitrary filters.

## Next Steps

- R5 only after enough evidence accumulates for safe deterministic recommendation refinement.
- R2C/R3C if operational cadence/scheduling is prioritized.
- UX/UI refine later, based on real evidence usage.

## Git Status

Implementation code committed in `e3f9749f409258f8ebbfdd7b8de2101e07ede9d3`. Documentation closure files are created after server acceptance in this report set.
