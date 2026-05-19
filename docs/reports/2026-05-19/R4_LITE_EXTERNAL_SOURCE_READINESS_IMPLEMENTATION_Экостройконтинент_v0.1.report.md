# R4-lite External Source Readiness Implementation Report

Дата: 2026-05-19

Проект: Экостройконтинент

Домен: SEO Dashboard / Visibility / Analytics Foundation

Slice: R4-lite. External Source State and Readiness Integration

## Executive Verdict

R4-lite implemented and accepted on canonical runtime.

The analytics read model now exposes a dedicated `external_source_readiness` block for `yandex_metrica` and `yandex_webmaster`. The block reports source state, freshness, imported periods, row counts, compact imported summaries and limitations.

This is not full R4. No external data was wired into primary traffic/contact metrics, no recommendations are generated from Metrica zeros or absent Webmaster query rows, and no live Yandex API calls happen during read model requests.

## Branch / Commit / Runtime

- Branch: `feat/r4-lite-external-source-readiness`
- Code commit deployed: `6bc7d11ce6c30dfb38a9de79e791048077f8ec25`
- Build workflow: `build-and-publish`, run `26119091654`
- Deploy workflow: `deploy-phase1`, run `26119227573`
- Runtime target: Selectel VM, compose stack `repo-app-1` + `repo-sql-1`
- Pinned image: `ghcr.io/kwentin3/ecostroycontinent-app@sha256:93d690aa903ddf2734d5ac0e962057ed92257b44e2af078b7001eb93e53fae4e`
- Readiness runtime commit: `6bc7d11ce6c30dfb38a9de79e791048077f8ec25`

## Files Changed

- `lib/analytics/repository.js`
- `lib/analytics/read-model.js`
- `components/admin/SeoVisibilityDashboard.js`
- `tests/analytics-read-model.test.js`
- `tests/yandex-metrica-import-r2a.test.js`
- `tests/yandex-webmaster-import-r3a.test.js`
- `docs/handbook/SEO_DASHBOARD_CURRENT_STATE_AND_AGENT_HANDOFF_Экостройконтинент_v0.1.md`
- `docs/AGENT_START_HERE.md`
- `docs/roadmaps/SEO_DASHBOARD_VISIBILITY_ANALYTICS_ROADMAP_Экостройконтинент_v0.1.md`

No migrations were added.

No scheduled imports were added.

No new Yandex API calls were added.

## DTO Shape

New top-level block:

```json
{
  "external_source_readiness": {
    "yandex_metrica": {
      "status": "ok",
      "last_attempted_at": "...",
      "last_successful_at": "...",
      "imported_period_start": "2026-05-16",
      "imported_period_end": "2026-05-18",
      "rows_imported": 42,
      "safe_error_message": "",
      "freshness": {
        "status": "fresh",
        "threshold": "last_successful_at <= 48h and imported_period_end <= 3 completed days",
        "reason": "within_threshold"
      },
      "data_actionability": "readiness_only",
      "limitations": [
        "external_metrica_not_operational_truth",
        "metrica_dimensions_r2b_not_imported",
        "external_metrica_all_values_zero"
      ],
      "imported_summary": {
        "traffic_rows": 9,
        "goal_rows": 33,
        "nonzero_rows": 0,
        "all_values_zero": true,
        "report_types": ["goal_reaches", "traffic_total"]
      }
    },
    "yandex_webmaster": {
      "status": "ok",
      "freshness": { "status": "fresh" },
      "data_actionability": "readiness_and_limited_indexation_evidence",
      "limitations": [
        "webmaster_url_samples_are_not_full_coverage",
        "webmaster_not_content_core_truth",
        "webmaster_query_visibility_no_rows_for_period"
      ],
      "imported_summary": {
        "host_verified": true,
        "host_data_status": "OK",
        "searchable_pages_count": 1,
        "excluded_pages_count": 0,
        "site_problem_counts": { "RECOMMENDATION": 3 },
        "url_sample_count": 1,
        "resolved_url_sample_count": 1,
        "query_visibility_rows": 0
      }
    }
  }
}
```

For compatibility, the same block is also available under `source_diagnostics.external_source_readiness`.

## Data Access Functions

Added compact repository helpers:

- `getMetricaImportSummary`
- `getLatestWebmasterHostSnapshot`
- `getLatestWebmasterIndexationSnapshot`
- `getWebmasterUrlSampleSummary`
- `getWebmasterQueryVisibilitySummary`

These helpers read only project-owned tables:

- `analytics_source_sync_state`
- `external_metrica_daily_aggregate`
- `external_webmaster_host_snapshot`
- `external_webmaster_indexation_snapshot`
- `external_webmaster_url_sample`
- `external_webmaster_query_visibility_daily`

They do not call Yandex APIs, do not return raw API responses and do not expose metadata payloads.

## Metrica Readiness Result

Server acceptance result:

- status: `ok`
- freshness: `fresh`
- imported period: `2026-05-16..2026-05-18`
- rows imported: `42`
- traffic rows: `9`
- goal rows: `33`
- nonzero rows: `0`
- all values zero: `true`
- data actionability: `readiness_only`

Limitations emitted:

- `external_metrica_not_operational_truth`
- `metrica_dimensions_r2b_not_imported`
- `external_metrica_all_values_zero`

Interpretation:

Metrica import is technically healthy, but current imported values remain external zero aggregates. They are shown as readiness diagnostics only and are not used as primary traffic/contact truth.

## Webmaster Readiness Result

Server acceptance result:

- status: `ok`
- freshness: `fresh`
- imported period: `2026-05-05..2026-05-17`
- rows imported: `3`
- unmapped URL count: `0`
- host verified: `true`
- host data status: `OK`
- searchable pages count: `1`
- excluded pages count: `0`
- site problem counts: `{ "RECOMMENDATION": 3 }`
- URL sample count: `1`
- resolved URL sample count: `1`
- query visibility rows: `0`
- data actionability: `readiness_and_limited_indexation_evidence`

Limitations emitted:

- `webmaster_url_samples_are_not_full_coverage`
- `webmaster_not_content_core_truth`
- `webmaster_query_visibility_no_rows_for_period`

Interpretation:

Webmaster readiness is useful for source health, host verification and limited indexation evidence. It is not enough for low CTR or query opportunity recommendations.

## Freshness Thresholds

Implemented defaults:

- Metrica: fresh when `last_successful_at <= 48h` and `imported_period_end <= 3 completed days`.
- Webmaster: fresh when `last_successful_at <= 7 days`.

These are implementation defaults for R4-lite, not permanent product law.

## UI Behavior

`/admin/visibility` keeps consuming the read model only.

The existing source diagnostics section now renders a compact external readiness card for each Yandex source:

- status/freshness badge;
- imported period;
- rows imported;
- data actionability;
- first few limitation codes.

No broad UX/UI redesign was done.

## Tests / Build

Local verification:

- Targeted read model tests: passed.
- Targeted R2A/R3A/admin visibility guard tests: passed.
- `npm test`: passed, `550/550`.
- `npm run build`: passed.
- `git diff --check`: passed.

Added/updated test coverage:

- read model contains `external_source_readiness`;
- Metrica source state appears in readiness block;
- Webmaster source state appears in readiness block;
- Metrica all-zero rows emit `external_metrica_all_values_zero`;
- Metrica zeros do not overwrite primary overview visits/contact metrics;
- Webmaster host/indexation summary is exposed;
- empty Webmaster query rows emit `webmaster_query_visibility_no_rows_for_period`;
- empty imported tables are handled;
- stale thresholds are handled;
- read model/repository path has no live Yandex API calls;
- DTO has no raw/secrets keys;
- recommendations are not generated from external zero limitations.

## Server Acceptance

Deployment:

- Published pinned image through `build-and-publish`.
- Deployed through `deploy-phase1`.
- Canonical readiness returned database `ok` and runtime commit `6bc7d11ce6c30dfb38a9de79e791048077f8ec25`.

Acceptance checks:

- Authorized request to `/api/admin/visibility/read-model?period=28`: passed.
- `/admin/visibility?period=28`: `200`.
- `external_source_readiness`: present.
- `yandex_metrica.status`: `ok`.
- `yandex_metrica.freshness.status`: `fresh`.
- `yandex_metrica.limitations`: includes `external_metrica_all_values_zero`.
- `yandex_webmaster.status`: `ok`.
- `yandex_webmaster.freshness.status`: `fresh`.
- `yandex_webmaster.imported_summary.host_verified`: `true`.
- `yandex_webmaster.imported_summary.query_visibility_rows`: `0`.
- `yandex_webmaster.limitations`: includes `webmaster_query_visibility_no_rows_for_period`.
- Primary overview visits remained first-party: `7`.
- Recommendations did not include `external_metrica_all_values_zero`.
- Code scan on deployed runtime confirmed no Yandex API URLs or `fetch` in read model/repository path.
- DTO key scan found no raw response/request, auth, token, client secret, form values, IP or user agent fields.

Telemetry smoke:

- Corrected test telemetry POST to `/api/telemetry/events`: `202`.
- Response: `stored=true`, `event_name=page_viewed`, `journey_created=false`.
- Canonical SQL proof: one `telemetry_events` row for `/r4-lite-acceptance`, `is_test=true`, `is_internal=false`.

Temporary acceptance operator:

- A temporary superadmin user was inserted only for the authorized request smoke and deleted in the same script.
- Cleanup proof: `0` users remain with the `r4lite_%` username prefix.

## Security Checks

Passed:

- no Yandex OAuth tokens in DTO;
- no client secret in DTO;
- no Webmaster token in DTO;
- no raw external responses in DTO;
- no raw request dumps;
- no form values;
- no IP/user agent exposure;
- no live external Yandex API calls in read model path;
- UI does not call Yandex API;
- read model does not expose raw events;
- Metrica zeros are not used as operational truth.

## What Was Not Implemented

- Full R4 external metric/evidence integration.
- R2B source/device/region/landing imports.
- R3B query/page visibility deep import.
- Scheduled imports.
- New Yandex API calls.
- New migrations.
- LLM.
- Lead/intake.
- Visual heatmap.
- Recommendation rules based on Metrica zeros or absent query rows.
- Broad `/admin/visibility` UX redesign.

## Known Limitations

- Metrica imported values are currently all zero for the accepted period.
- Webmaster query visibility rows are currently `0`.
- Webmaster URL samples are samples, not full index coverage.
- `data_actionability` is readiness/limited diagnostic, not a full SEO evidence score.
- Full R4 should wait for richer external rows, likely R3B query/page visibility or R2B traffic dimensions.

## Recommended Next Step

Recommended next implementation slice:

R3B query/page visibility import, unless the team decides that Metrica traffic/source/device/region is more urgent.

Why:

- R4-lite now shows source readiness honestly.
- SEO Manager value will improve most when Webmaster contributes real query/page visibility evidence.
- Full R4 should not be started until external evidence is richer.

## Git Status

At report creation time, code commit `6bc7d11ce6c30dfb38a9de79e791048077f8ec25` was deployed and accepted. Documentation/report updates are pending final commit.
