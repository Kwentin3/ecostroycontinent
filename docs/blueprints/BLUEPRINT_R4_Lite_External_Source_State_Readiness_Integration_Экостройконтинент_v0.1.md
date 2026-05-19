# Blueprint R4-lite. External Source State and Readiness Integration

Русское название: Интеграция состояния внешних источников и готовности данных.

Проект: Экостройконтинент
Домен: SEO Dashboard / Visibility / Analytics Foundation
Версия: v0.1
Дата: 2026-05-19

## 1. Architecture Decision Summary

Recommended implementation architecture:

```text
project-owned external import storage
-> compact source readiness builders
-> analytics read model DTO
-> /admin/visibility diagnostics/limitations
```

No external API calls happen in the read model request path.

R4-lite is deliberately not full R4. It integrates external source readiness, compact summaries and limitations. It does not integrate external data into primary traffic/contact metrics or recommendation generation.

## 2. Current Architecture

Current read model behavior:

- `lib/analytics/read-model.js` already consumes `analytics_source_sync_state` through `listSourceSyncStates`;
- `lib/analytics/read-model.js` reads first-party/page aggregates from `analytics_page_daily`;
- `lib/analytics/read-model.js` reads search visibility from `external_search_visibility_daily`;
- `lib/analytics/read-model.js` does not read `external_metrica_daily_aggregate`;
- `lib/analytics/read-model.js` does not read `external_webmaster_*` tables;
- `/admin/visibility` consumes the read model DTO from `app/api/admin/visibility/read-model/route.js`;
- UI does not call Yandex APIs directly.

Current imported external data:

- R2A Metrica: 42 rows in `external_metrica_daily_aggregate`, all metric values zero for `2026-05-16..2026-05-18`;
- R3A Webmaster: 1 host snapshot, 1 indexation snapshot, 1 URL sample, 0 query visibility rows;
- both sources have `analytics_source_sync_state.status=ok`.

## 3. Proposed Data Flow

```text
analytics_source_sync_state
external_metrica_daily_aggregate
external_webmaster_host_snapshot
external_webmaster_indexation_snapshot
external_webmaster_url_sample
external_webmaster_query_visibility_daily
analytics_unmapped_url_diagnostic
  ->
read model source readiness builder
  ->
analytics read model DTO
  ->
/admin/visibility source diagnostics and limitations
```

R4-lite should query only compact summaries. It should not load raw rows or live external API responses into the DTO.

## 4. Read Model Contract Addition

Recommended new block:

```json
{
  "external_source_readiness": {
    "yandex_metrica": {
      "status": "ok",
      "last_attempted_at": "2026-05-19T11:41:10.633Z",
      "last_successful_at": "2026-05-19T11:41:10.633Z",
      "imported_period_start": "2026-05-16",
      "imported_period_end": "2026-05-18",
      "rows_imported": 42,
      "safe_error_message": "",
      "freshness": {
        "status": "fresh",
        "threshold": "implementation_default",
        "reason": ""
      },
      "data_actionability": "readiness_only",
      "limitations": [
        "external_metrica_all_values_zero",
        "external_metrica_not_operational_truth",
        "metrica_dimensions_r2b_not_imported"
      ],
      "imported_summary": {
        "traffic_rows": 9,
        "goal_rows": 33,
        "nonzero_rows": 0,
        "all_values_zero": true,
        "report_types": ["traffic_total", "goal_reaches"]
      }
    },
    "yandex_webmaster": {
      "status": "ok",
      "last_attempted_at": "2026-05-19T18:07:40.192Z",
      "last_successful_at": "2026-05-19T18:07:40.192Z",
      "imported_period_start": "2026-05-05",
      "imported_period_end": "2026-05-17",
      "rows_imported": 3,
      "unmapped_url_count": 0,
      "safe_error_message": "",
      "freshness": {
        "status": "fresh",
        "threshold": "implementation_default",
        "reason": ""
      },
      "data_actionability": "readiness_and_limited_indexation_evidence",
      "limitations": [
        "webmaster_url_samples_are_not_full_coverage",
        "webmaster_query_visibility_no_rows_for_period",
        "webmaster_not_content_core_truth"
      ],
      "imported_summary": {
        "host_verified": true,
        "host_data_status": "OK",
        "searchable_pages_count": 1,
        "excluded_pages_count": 0,
        "site_problem_counts": {
          "RECOMMENDATION": 3
        },
        "url_sample_count": 1,
        "resolved_url_sample_count": 1,
        "query_visibility_rows": 0
      }
    }
  }
}
```

Alternative: add the same data under existing `source_diagnostics.external_readiness`. The implementation should prefer the option with least DTO churn, but the semantics above must remain.

## 5. Repository / Data Access

Existing:

- `listSourceSyncStates(db)`.

Recommended new compact repository functions:

- `getMetricaImportSummary({ startDate, endDate }, db)`;
- `getWebmasterImportSummary({ startDate, endDate }, db)`;
- `getLatestWebmasterHostSnapshot(db)`;
- `getLatestWebmasterIndexationSnapshot(db)`;
- `getWebmasterUrlSampleSummary(db)`;
- `getWebmasterQueryVisibilitySummary({ startDate, endDate }, db)`.

Data access rules:

- return compact aggregate rows only;
- use project-owned tables, never live Yandex APIs;
- tolerate missing tables with safe empty summaries during deploy/migration transitions if local patterns require it;
- do not expose raw external responses, request configs or metadata that could contain secrets;
- do not load all imported rows into the read model.

## 6. Metrica Handling Rules

If `yandex_metrica` source state is `ok` and all imported values are zero:

- set limitation `external_metrica_all_values_zero`;
- set `data_actionability=readiness_only`;
- show "external source imported successfully; no external Metrica activity observed for accepted period";
- do not feed these zeros into primary overview traffic cards;
- do not derive conversion/contact conclusions from these zeros;
- do not generate recommendations from these zeros.

If non-zero Metrica values appear later:

- R4-lite may report them in the compact imported summary;
- full interpretation of traffic sources, devices, regions and landing URLs remains R2B/R4 full scope.

## 7. Webmaster Handling Rules

Allowed in R4-lite:

- expose host verification;
- expose host data status;
- expose site/indexation summary;
- expose URL sample counts and resolved/unmapped counts;
- expose query visibility row count.

Required limitations:

- in-search URL samples are samples, not complete index coverage;
- Webmaster is not Content Core truth;
- query rows are aggregate search evidence only;
- query visibility rows being absent does not mean zero demand or zero visibility.

If `query_visibility_rows=0`:

- set limitation `webmaster_query_visibility_no_rows_for_period`;
- do not generate low CTR recommendations;
- do not generate query opportunity recommendations;
- keep `search_visibility` detailed integration for R3B/full R4.

## 8. Freshness Rules

Initial conservative implementation defaults:

- Metrica:
  - `fresh` if `last_successful_at` is within 48 hours and `imported_period_end` is not older than 3 completed days;
  - `stale` otherwise, unless source status is already `failed`, `partial` or `not_configured`.
- Webmaster:
  - `fresh` if `last_successful_at` is within 7 days;
  - `stale` otherwise, unless source status is already `failed`, `partial` or `not_configured`.

These thresholds are implementation defaults, not permanent product law. They should be easy to adjust later.

Yandex Metrica Reporting API responses include fields such as `data_lag`, `sampled` and `sample_share`; future R2B/R4 full can use those if imported. R4-lite should not require them because R2A storage did not capture them as first-class contract fields.

## 9. Recommendation Guardrails

R4-lite must not change recommendation generation based on weak external data.

Forbidden:

- recommending "fix low CTR" from zero Webmaster query rows;
- recommending "increase traffic" from zero Metrica visits;
- recommending "fix conversion" from zero Metrica goals;
- treating Webmaster URL samples as complete page coverage;
- using Metrica or Webmaster imported counts as operational truth for contact actions or leads.

Allowed:

- source readiness warnings;
- limitations;
- source health badges;
- later action item such as "deepen Webmaster query import" only as planning context, not page-level SEO recommendation.

## 10. Security / Privacy

R4-lite must not expose:

- OAuth tokens;
- refresh tokens;
- client secrets;
- Authorization headers;
- raw request dumps;
- raw external API responses;
- raw sessions;
- IP addresses;
- raw user agents;
- form values;
- user-level identifiers;
- lead IDs.

Read model gets compact summaries only.

## 11. Testing Plan

Required tests:

- source state `ok` for Metrica appears in read model readiness block;
- source state `ok` for Webmaster appears in read model readiness block;
- Metrica all-zero rows create `external_metrica_all_values_zero` limitation;
- Metrica zero rows do not overwrite primary overview visits/contact metrics;
- Webmaster host/indexation summary is exposed;
- Webmaster query rows empty creates `webmaster_query_visibility_no_rows_for_period` limitation;
- absent Webmaster query rows do not generate query/CTR recommendations;
- empty imported tables are handled gracefully;
- stale source state/freshness threshold is handled;
- no Yandex API calls occur in read model code path;
- no secrets/raw responses appear in DTO serialization.

Existing tests around no direct UI -> Yandex API and read model privacy boundaries should remain green.

## 12. Server Acceptance Plan

After implementation:

1. Deploy through existing workflow.
2. Make an authorized `/api/admin/visibility/read-model` request.
3. Verify `external_source_readiness` or chosen equivalent block exists.
4. Verify `yandex_metrica` state, period, rows and limitations:
   - status `ok`;
   - period `2026-05-16..2026-05-18` or current imported period;
   - rows imported `42` or current accepted value;
   - all-zero limitation present if values remain zero.
5. Verify `yandex_webmaster` state, period, rows, host/indexation summary and limitations:
   - status `ok`;
   - host verified;
   - query visibility empty limitation if rows remain `0`.
6. Verify primary overview traffic/contact metrics are not polluted by Metrica zeros.
7. Verify no external API request is made during read model request.
8. Verify `/admin/visibility` still opens and consumes read model only.
9. Verify no secrets are present in response.

## 13. Rollback

Rollback path:

- revert read model/repository integration commit;
- imported R2A/R3A tables remain harmless;
- no data deletion required;
- no env change required;
- no migration rollback expected for R4-lite because it should not add migrations.

## 14. Implementation Non-Goals Reminder

R4-lite implementation must not:

- run new imports;
- add scheduled jobs;
- add migrations;
- redesign `/admin/visibility`;
- connect UI to Yandex APIs;
- connect read model to live external APIs;
- implement R2B/R3B;
- implement full R4 external evidence/recommendations;
- touch LLM;
- touch lead/intake.

## 15. Open Implementation Decisions

1. Use new top-level `external_source_readiness` or nested `source_diagnostics.external_readiness`.
2. Decide exact freshness threshold implementation location.
3. Decide whether current UI can render the block without layout changes, or whether R4-lite should stop at DTO/API contract.
4. Decide how much of Webmaster indexation summary belongs in current source diagnostics.
5. Decide whether source `ok` and data actionability should be visually distinct in a later UI refinement.

## 16. References

- `docs/reports/2026-05-19/R4_READINESS_AUDIT_Экостройконтинент_v0.1.report.md`
- `docs/product-ux/PRD_R4_Lite_External_Source_State_Readiness_Integration_Экостройконтинент_v0.1.md`
- `docs/product-ux/SEO_Dashboard_Analytics_Read_Model_Contract_Экостройконтинент_v0.1.md`
- `docs/blueprints/ADDENDUM_R2_R3_External_Imports_Storage_Direction_Экостройконтинент_v0.1.md`
- Yandex Metrica Reporting API table endpoint: https://yandex.com/dev/metrika/en/stat/openapi/data
- Yandex Webmaster API documentation: https://yandex.com/dev/webmaster/doc/en/
